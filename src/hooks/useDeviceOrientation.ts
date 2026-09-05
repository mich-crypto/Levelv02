import { useState, useEffect, useRef, useCallback } from 'react';
import { OrientationData, CalibrationOffset } from '../types';

const STORAGE_KEY_CALIBRATION = 'camper_leveler_calibration_v1';
const STORAGE_KEY_SMOOTHING = 'camper_leveler_smoothing_v1';

// iOS 13+ Safari requires an explicit, user-gesture-triggered permission grant
// before DeviceOrientation/DeviceMotion events will ever fire. Android and
// desktop browsers have no such API and should behave as before.
function iosMotionPermissionRequired(): boolean {
  if (typeof window === 'undefined') return false;
  const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
    .DeviceOrientationEvent;
  return !!DOE && typeof DOE.requestPermission === 'function';
}

// Shortest signed distance from `to` back to `from`, in (-180, 180]. Using a
// plain subtraction to measure how far a new sample moved breaks down near
// the +-180 wrap boundary (e.g. 179 -> -179 looks like a 358 degree jump when
// it's actually a 2 degree one) - this keeps jump detection honest there.
function angularDelta(to: number, from: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// DeviceOrientation's beta/gamma are Euler angles, which have a real
// coordinate singularity: near certain mounting angles (a head unit propped
// up close to vertical is exactly this range) a tiny physical rotation can
// make the reported angle jump by tens or even ~100+ degrees for a sample or
// two before snapping back. A parked van simply can't move that fast, so
// treat any single-sample jump bigger than this as a sensor glitch rather
// than real motion, and only accept it once a couple of samples agree it's
// real (e.g. the unit was actually picked up and rotated, or the app resumed
// after being backgrounded for a while).
const MAX_PLAUSIBLE_JUMP_DEG = 20;
const JUMP_CONFIRMATIONS_REQUIRED = 3;

/** How far the page content is rotated from the device's natural orientation. */
function getScreenAngle(): number {
  if (typeof window === 'undefined') return 0;
  return (
    window.screen?.orientation?.angle ??
    (typeof window.orientation === 'number' ? window.orientation : 0)
  );
}

/**
 * Compass bearing that the TOP OF THE SCREEN points to, in degrees clockwise
 * from north — or undefined when this device gives us nothing north-referenced.
 *
 * Two corrections the old code was missing, which together read as a compass
 * that is right when you face north or south and 180 degrees out east or west:
 *
 *  - `alpha` is measured ANTI-clockwise from north, while a compass bearing runs
 *    clockwise, so it has to be inverted (360 - alpha) rather than used raw.
 *  - `alpha` describes the device's NATIVE top. On a head unit mounted in
 *    landscape the top of the screen is a different edge, so the screen's
 *    rotation has to be added back on.
 *
 * Heading is only meaningful when the reading is referenced to magnetic north.
 * A plain `deviceorientation` event on Android is usually RELATIVE to wherever
 * the device happened to be pointing when the listener attached, which is worse
 * than useless for a compass — so we return undefined and let the UI say so
 * rather than print a confident, arbitrary number.
 */
function compassHeadingFrom(event: DeviceOrientationEvent): number | undefined {
  const screenAngle = getScreenAngle();

  // iOS reports a true heading directly, already clockwise from north.
  const webkitHeading = (event as unknown as { webkitCompassHeading?: number })
    .webkitCompassHeading;
  if (typeof webkitHeading === 'number' && !Number.isNaN(webkitHeading)) {
    return (webkitHeading + screenAngle + 360) % 360;
  }

  if (event.absolute && event.alpha !== null && event.alpha !== undefined) {
    return (360 - event.alpha + screenAngle + 360) % 360;
  }

  return undefined;
}

export function useDeviceOrientation() {
  const [hasSensor, setHasSensor] = useState<boolean>(false);

  // Whether this browser (iOS Safari) gates motion/orientation behind a
  // user-gesture permission prompt, and whether that permission was granted.
  const [needsMotionPermission] = useState<boolean>(iosMotionPermissionRequired);
  const [motionPermissionGranted, setMotionPermissionGranted] = useState<boolean>(
    () => !iosMotionPermissionRequired()
  );

  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    try {
      type PermissionEvent = { requestPermission?: () => Promise<string> };
      const DOE = (window as unknown as { DeviceOrientationEvent?: PermissionEvent }).DeviceOrientationEvent;
      const DME = (window as unknown as { DeviceMotionEvent?: PermissionEvent }).DeviceMotionEvent;

      let granted = true;
      if (DOE && typeof DOE.requestPermission === 'function') {
        granted = (await DOE.requestPermission()) === 'granted' && granted;
      }
      if (DME && typeof DME.requestPermission === 'function') {
        granted = (await DME.requestPermission()) === 'granted' && granted;
      }
      setMotionPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.warn('Motion permission request failed:', err);
      setMotionPermissionGranted(false);
      return false;
    }
  }, []);

  // Manual simulation state (for testing or when sensor is idle)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedPitch, setSimulatedPitch] = useState<number>(1.8);
  const [simulatedRoll, setSimulatedRoll] = useState<number>(-2.4);

  // Calibration offset (zero tare)
  const [calibration, setCalibration] = useState<CalibrationOffset>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALIBRATION);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return { pitchOffset: 0, rollOffset: 0, isCalibrated: false };
  });

  const [smoothingFactor, setSmoothingFactor] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SMOOTHING);
      if (saved) return parseFloat(saved);
    } catch {
      // ignore
    }
    return 0.22;
  });

  const [orientation, setOrientation] = useState<OrientationData>({
    pitch: 1.8,
    roll: -2.4,
    rawPitch: 1.8,
    rawRoll: -2.4,
  });

  // Filtered values refs
  const filteredPitchRef = useRef<number>(1.8);
  const filteredRollRef = useRef<number>(-2.4);
  const lastRawPitchRef = useRef<number>(1.8);
  const lastRawRollRef = useRef<number>(-2.4);
  const sensorEventsCountRef = useRef<number>(0);

  // Tracks a not-yet-confirmed large jump in the raw sensor reading, so it
  // can be told apart from a genuine sensor glitch (see MAX_PLAUSIBLE_JUMP_DEG).
  const pendingJumpRef = useRef<{ pitch: number; roll: number } | null>(null);
  const pendingJumpCountRef = useRef<number>(0);

  // Latest north-referenced heading, or undefined when this device has no
  // absolute source (see compassHeadingFrom).
  const headingRef = useRef<number | undefined>(undefined);

  // Keep latest calibration in a ref so useEffect callback always reads current values instantly
  const calibrationRef = useRef<CalibrationOffset>(calibration);
  calibrationRef.current = calibration;

  // Save calibration (Tare Zero)
  // FIX: Directly subtract the raw pitch/roll from current raw values
  const setZeroCalibration = useCallback(() => {
    const rawP = lastRawPitchRef.current;
    const rawR = lastRawRollRef.current;

    const newCalibration: CalibrationOffset = {
      pitchOffset: rawP,
      rollOffset: rawR,
      isCalibrated: true,
      calibratedAt: new Date().toLocaleTimeString(),
    };
    setCalibration(newCalibration);
    calibrationRef.current = newCalibration;

    // Immediately recalculate filtered & displayed orientation so it zeroes out instantly
    filteredPitchRef.current = 0;
    filteredRollRef.current = 0;
    setOrientation({
      pitch: 0,
      roll: 0,
      rawPitch: rawP,
      rawRoll: rawR,
    });

    try {
      localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(newCalibration));
    } catch {
      // ignore
    }
  }, []);

  const resetCalibration = useCallback(() => {
    const newCalibration: CalibrationOffset = {
      pitchOffset: 0,
      rollOffset: 0,
      isCalibrated: false,
    };
    setCalibration(newCalibration);
    calibrationRef.current = newCalibration;

    const rawP = lastRawPitchRef.current;
    const rawR = lastRawRollRef.current;
    filteredPitchRef.current = rawP;
    filteredRollRef.current = rawR;
    setOrientation({
      pitch: Math.round(rawP * 10) / 10,
      roll: Math.round(rawR * 10) / 10,
      rawPitch: rawP,
      rawRoll: rawR,
    });

    try {
      localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(newCalibration));
    } catch {
      // ignore
    }
  }, []);

  const updateSmoothingFactor = useCallback((factor: number) => {
    setSmoothingFactor(factor);
    try {
      localStorage.setItem(STORAGE_KEY_SMOOTHING, factor.toString());
    } catch {
      // ignore
    }
  }, []);

  // Main listener for Android Head Unit / Android Browser Gyroscope & Accelerometer
  useEffect(() => {
    // On iOS Safari, wait for the user to grant motion permission via a tap
    // before touching the sensor APIs at all.
    if (needsMotionPermission && !motionPermissionGranted) {
      return;
    }

    if (isSimulating) {
      const rawPitch = simulatedPitch;
      const rawRoll = simulatedRoll;
      lastRawPitchRef.current = rawPitch;
      lastRawRollRef.current = rawRoll;

      const cal = calibrationRef.current;
      const correctedPitch = rawPitch - (cal.isCalibrated ? cal.pitchOffset : 0);
      const correctedRoll = rawRoll - (cal.isCalibrated ? cal.rollOffset : 0);

      filteredPitchRef.current = correctedPitch;
      filteredRollRef.current = correctedRoll;

      setOrientation({
        pitch: Math.round(correctedPitch * 10) / 10,
        roll: Math.round(correctedRoll * 10) / 10,
        rawPitch,
        rawRoll,
      });
      return;
    }

    const processAngles = (pitchDeg: number, rollDeg: number, yawDeg?: number) => {
      sensorEventsCountRef.current += 1;
      if (!hasSensor) {
        setHasSensor(true);
      }

      // Reject implausible single-sample jumps (Euler-angle singularity near
      // certain mounting angles, or a one-off sensor glitch) unless several
      // consecutive samples agree the device really did move that far.
      const jumpP = Math.abs(angularDelta(pitchDeg, lastRawPitchRef.current));
      const jumpR = Math.abs(angularDelta(rollDeg, lastRawRollRef.current));

      if (jumpP > MAX_PLAUSIBLE_JUMP_DEG || jumpR > MAX_PLAUSIBLE_JUMP_DEG) {
        const pending = pendingJumpRef.current;
        const matchesPending =
          !!pending &&
          Math.abs(angularDelta(pitchDeg, pending.pitch)) < 5 &&
          Math.abs(angularDelta(rollDeg, pending.roll)) < 5;

        if (matchesPending) {
          pendingJumpCountRef.current += 1;
        } else {
          pendingJumpRef.current = { pitch: pitchDeg, roll: rollDeg };
          pendingJumpCountRef.current = 1;
        }

        if (pendingJumpCountRef.current < JUMP_CONFIRMATIONS_REQUIRED) {
          // Not confirmed yet - drop this sample, keep showing the last good value.
          return;
        }
        // Confirmed by several consecutive samples - accept it as real motion below.
      } else {
        pendingJumpRef.current = null;
        pendingJumpCountRef.current = 0;
      }

      lastRawPitchRef.current = pitchDeg;
      lastRawRollRef.current = rollDeg;

      // Apply Calibration offset from ref: corrected = raw - offset
      const cal = calibrationRef.current;
      const correctedPitch = pitchDeg - (cal.isCalibrated ? cal.pitchOffset : 0);
      const correctedRoll = rollDeg - (cal.isCalibrated ? cal.rollOffset : 0);

      // Low-pass exponential moving average filter
      const alpha = smoothingFactor;
      filteredPitchRef.current = filteredPitchRef.current * (1 - alpha) + correctedPitch * alpha;
      filteredRollRef.current = filteredRollRef.current * (1 - alpha) + correctedRoll * alpha;

      setOrientation({
        pitch: Math.round(filteredPitchRef.current * 10) / 10,
        roll: Math.round(filteredRollRef.current * 10) / 10,
        yaw: yawDeg,
        rawPitch: pitchDeg,
        rawRoll: rollDeg,
      });
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta;
      const gamma = event.gamma;

      const heading = compassHeadingFrom(event);
      if (heading !== undefined) {
        headingRef.current = heading;
      }

      if (beta === null && gamma === null) return;

      const b = beta ?? 0;
      const g = gamma ?? 0;

      const screenAngle = getScreenAngle();

      let extractedPitch = 0;
      let extractedRoll = 0;

      if (screenAngle === 90) {
        extractedPitch = g;
        extractedRoll = -b;
      } else if (screenAngle === 270 || screenAngle === -90) {
        extractedPitch = -g;
        extractedRoll = b;
      } else {
        if (window.innerWidth > window.innerHeight) {
          extractedPitch = g;
          extractedRoll = -b;
        } else {
          extractedPitch = b;
          extractedRoll = g;
        }
      }

      processAngles(extractedPitch, extractedRoll, headingRef.current);
    };

    // Android fires the north-referenced reading on its own event; the plain
    // `deviceorientation` one is usually relative and no use as a compass.
    const handleAbsoluteOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha === null || event.alpha === undefined) return;
      headingRef.current = (360 - event.alpha + getScreenAngle() + 360) % 360;
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      if (sensorEventsCountRef.current > 0) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const ax = acc.x;
      const ay = acc.y;
      const az = acc.z;

      const pitchFromGravity = (Math.atan2(ay, Math.sqrt(ax * ax + az * az)) * 180) / Math.PI;
      const rollFromGravity = (Math.atan2(-ax, az) * 180) / Math.PI;

      if (window.innerWidth > window.innerHeight) {
        processAngles(rollFromGravity, -pitchFromGravity);
      } else {
        processAngles(pitchFromGravity, rollFromGravity);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
    window.addEventListener('devicemotion', handleMotion, true);

    const timer = setTimeout(() => {
      if (sensorEventsCountRef.current === 0) {
        setHasSensor(false);
      }
    }, 2000);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation, true);
      window.removeEventListener('devicemotion', handleMotion, true);
      clearTimeout(timer);
    };
  }, [
    isSimulating,
    simulatedPitch,
    simulatedRoll,
    smoothingFactor,
    hasSensor,
    needsMotionPermission,
    motionPermissionGranted,
  ]);

  return {
    orientation,
    hasSensor,
    calibration,
    setZeroCalibration,
    resetCalibration,
    smoothingFactor,
    updateSmoothingFactor,
    isSimulating,
    setIsSimulating,
    simulatedPitch,
    setSimulatedPitch,
    simulatedRoll,
    setSimulatedRoll,
    needsMotionPermission,
    motionPermissionGranted,
    requestMotionPermission,
  };
}
