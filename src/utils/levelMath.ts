import { VanDimensions, VanLengthPreset, WheelLiftResult, LevelQuality } from '../types';

export const JUMPER_PRESETS: Record<VanLengthPreset, VanDimensions> = {
  L1: {
    id: 'L1',
    name: 'Citroën Jumper L1',
    subName: 'Short Wheelbase (4.96m)',
    wheelbaseMm: 3000,
    trackWidthMm: 1810,
    overallLengthMm: 4963,
  },
  L2: {
    id: 'L2',
    name: 'Citroën Jumper L2',
    subName: 'Medium Wheelbase (5.41m) - Common Camper',
    wheelbaseMm: 3450,
    trackWidthMm: 1810,
    overallLengthMm: 5413,
  },
  L3: {
    id: 'L3',
    name: 'Citroën Jumper L3',
    subName: 'Long Wheelbase (5.99m) - Popular 6m Camper',
    wheelbaseMm: 4035,
    trackWidthMm: 1810,
    overallLengthMm: 5998,
  },
  L4: {
    id: 'L4',
    name: 'Citroën Jumper L4',
    subName: 'Extra Long Wheelbase (6.36m)',
    wheelbaseMm: 4035,
    trackWidthMm: 1810,
    overallLengthMm: 6363,
  },
};

/**
 * Calculates required lift (in cm) for each of the 4 wheels based on pitch & roll.
 * Pitch > 0 = Nose is UP (Rear is lower, needs lift)
 * Pitch < 0 = Nose is DOWN (Front is lower, needs lift)
 * Roll > 0 = Tilting RIGHT (Right side is lower, needs lift)
 * Roll < 0 = Tilting LEFT (Left side is lower, needs lift)
 */
export function calculateWheelLifts(
  pitchDeg: number,
  rollDeg: number,
  vanDimensions: VanDimensions
): WheelLiftResult {
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const rollRad = (rollDeg * Math.PI) / 180;

  const halfTrack = vanDimensions.trackWidthMm / 2;
  const halfWheelbase = vanDimensions.wheelbaseMm / 2;

  // Relative elevation of each corner (in mm, positive = higher than center, negative = lower)
  // Front is +halfWheelbase, Rear is -halfWheelbase
  // Left is -halfTrack, Right is +halfTrack (with standard roll right-down)
  
  // Elevation relative to center:
  // Pitch > 0 (nose up) -> front is +elevation, rear is -elevation
  // Roll > 0 (tilting right) -> right is -elevation, left is +elevation
  const elevFL_mm = halfWheelbase * Math.sin(pitchRad) + halfTrack * Math.sin(rollRad);
  const elevFR_mm = halfWheelbase * Math.sin(pitchRad) - halfTrack * Math.sin(rollRad);
  const elevRL_mm = -halfWheelbase * Math.sin(pitchRad) + halfTrack * Math.sin(rollRad);
  const elevRR_mm = -halfWheelbase * Math.sin(pitchRad) - halfTrack * Math.sin(rollRad);

  const maxElev = Math.max(elevFL_mm, elevFR_mm, elevRL_mm, elevRR_mm);

  // Required lift so every wheel meets the highest point:
  const liftFL_cm = Math.max(0, (maxElev - elevFL_mm) / 10);
  const liftFR_cm = Math.max(0, (maxElev - elevFR_mm) / 10);
  const liftRL_cm = Math.max(0, (maxElev - elevRL_mm) / 10);
  const liftRR_cm = Math.max(0, (maxElev - elevRR_mm) / 10);

  const wheels: Array<{ name: 'FL' | 'FR' | 'RL' | 'RR'; lift: number }> = [
    { name: 'FL', lift: liftFL_cm },
    { name: 'FR', lift: liftFR_cm },
    { name: 'RL', lift: liftRL_cm },
    { name: 'RR', lift: liftRR_cm },
  ];

  const highestWheel = wheels.reduce((prev, curr) => (curr.lift < prev.lift ? curr : prev)).name;
  const lowestWheel = wheels.reduce((prev, curr) => (curr.lift > prev.lift ? curr : prev)).name;
  const maxLiftNeeded = Math.max(liftFL_cm, liftFR_cm, liftRL_cm, liftRR_cm);

  return {
    fl: Math.round(liftFL_cm * 10) / 10,
    fr: Math.round(liftFR_cm * 10) / 10,
    rl: Math.round(liftRL_cm * 10) / 10,
    rr: Math.round(liftRR_cm * 10) / 10,
    highestWheel,
    lowestWheel,
    maxLiftNeeded: Math.round(maxLiftNeeded * 10) / 10,
  };
}

export function getLevelQuality(pitchDeg: number, rollDeg: number): LevelQuality {
  const totalTilt = Math.sqrt(pitchDeg * pitchDeg + rollDeg * rollDeg);
  if (totalTilt <= 0.4) return 'perfect';
  if (totalTilt <= 1.2) return 'acceptable';
  if (totalTilt <= 2.5) return 'warning';
  return 'critical';
}

export function getRampStepRecommendation(liftCm: number): {
  step: number;
  label: string;
  recommended: boolean;
} {
  if (liftCm < 1.0) {
    return { step: 0, label: 'Ground (No ramp)', recommended: false };
  }
  if (liftCm <= 4.5) {
    return { step: 1, label: 'Step 1 (~4 cm)', recommended: true };
  }
  if (liftCm <= 8.0) {
    return { step: 2, label: 'Step 2 (~7.5 cm)', recommended: true };
  }
  return { step: 3, label: 'Step 3 (~10+ cm)', recommended: true };
}

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}
