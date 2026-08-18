export interface OrientationData {
  pitch: number; // Front-to-back tilt in degrees (Positive = nose up, Negative = nose down)
  roll: number;  // Side-to-side tilt in degrees (Positive = right down / tilting right, Negative = left down)
  yaw?: number;  // Heading
  rawPitch: number;
  rawRoll: number;
}

export interface CalibrationOffset {
  pitchOffset: number;
  rollOffset: number;
  isCalibrated: boolean;
  calibratedAt?: string;
}

export interface VehicleConfig {
  wheelbaseCm: number;  // Distance between front and rear axles in cm (e.g. 403.5 cm)
  trackWidthCm: number; // Distance between left and right wheels in cm (e.g. 181.0 cm)
  toleranceDeg: number; // Tolerance in degrees to be considered level (e.g. 0.4°)
  presetName?: string;
}

export type VanLengthPreset = 'L1' | 'L2' | 'L3' | 'L4';

export interface VanDimensions {
  id: VanLengthPreset;
  name: string;
  subName: string;
  wheelbaseMm: number;
  trackWidthMm: number;
  overallLengthMm: number;
}

export interface WheelLiftResult {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
  highestWheel: 'FL' | 'FR' | 'RL' | 'RR';
  lowestWheel: 'FL' | 'FR' | 'RL' | 'RR';
  maxLiftNeeded: number;
}

export type LevelQuality = 'perfect' | 'acceptable' | 'warning' | 'critical';
