import React from 'react';
import { VehicleConfig } from '../types';
import { LevelInstrument } from './LevelInstrument';
import { AxisReadout } from './AxisReadout';

interface SimpleVehicleViewProps {
  pitch: number; // + = front high / back low
  roll: number; // + = left high / right low
  config: VehicleConfig;
}

export const SimpleVehicleView: React.FC<SimpleVehicleViewProps> = ({ pitch, roll, config }) => {
  const tolerance = config.toleranceDeg ?? 0.4;
  const isRollLevel = Math.abs(roll) <= tolerance;
  const isPitchLevel = Math.abs(pitch) <= tolerance;
  const isLevel = isRollLevel && isPitchLevel;

  // Ramp height needed, from the vehicle's own dimensions.
  const rollCm = (config.trackWidthCm * Math.sin((Math.abs(roll) * Math.PI) / 180)).toFixed(1);
  const pitchCm = (config.wheelbaseCm * Math.sin((Math.abs(pitch) * Math.PI) / 180)).toFixed(1);

  // Roll > 0 -> left is high, right is low -> lift the right.
  // Pitch > 0 -> front is high, back is low -> lift the back.
  const rollAction = roll > 0 ? 'Raise right' : 'Raise left';
  const pitchAction = pitch > 0 ? 'Raise back' : 'Raise front';

  return (
    <div className="cluster">
      <div className="cluster__axis order-2 lg:order-1">
        <AxisReadout
          label="Roll"
          axis="Side to side"
          value={roll}
          tolerance={tolerance}
          negLabel="Left"
          posLabel="Right"
          action={rollAction}
          distanceCm={rollCm}
          isLevel={isRollLevel}
        />
      </div>

      <div className="cluster__dial order-1 lg:order-2">
        <div>
          <LevelInstrument pitch={pitch} roll={roll} tolerance={tolerance} isLevel={isLevel} />
        </div>
      </div>

      <div className="cluster__axis order-3">
        <AxisReadout
          label="Pitch"
          axis="Front to back"
          value={pitch}
          tolerance={tolerance}
          negLabel="Front"
          posLabel="Back"
          action={pitchAction}
          distanceCm={pitchCm}
          isLevel={isPitchLevel}
        />
      </div>
    </div>
  );
};
