import { useState, useEffect, useRef, useCallback } from 'react';
import { OrientationData, CalibrationOffset } from '../types';

const STORAGE_KEY_CALIBRATION = 'camper_leveler_calibration_v1';
const STORAGE_KEY_SMOOTHING = 'camper_leveler_smoothing_v1';

export function useDeviceOrientation() {
  const [hasSensor, setHasSensor] = useState<boolean>(false);

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
      const alpha = event.alpha ?? 0;

      if (beta === null && gamma === null) return;

      const b = beta ?? 0;
      const g = gamma ?? 0;

      const screenAngle =
        window.screen?.orientation?.angle ??
        (typeof window.orientation === 'number' ? window.orientation : 0);

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

      processAngles(extractedPitch, extractedRoll, alpha);
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
    window.addEventListener('devicemotion', handleMotion, true);

    const timer = setTimeout(() => {
      if (sensorEventsCountRef.current === 0) {
        setHasSensor(false);
      }
    }, 2000);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('devicemotion', handleMotion, true);
      clearTimeout(timer);
    };
  }, [
    isSimulating,
    simulatedPitch,
    simulatedRoll,
    smoothingFactor,
    hasSensor,
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
  };
}
