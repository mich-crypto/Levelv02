import React from 'react';

interface CornerIndicatorProps {
  pitch: number; // + = front high / back low
  roll: number; // + = left high / right low
  tolerance: number;
}

/**
 * Four wheels, nothing else. A filled block is a corner sitting low; the
 * outlined-and-filled one is low on both axes, so it is the corner to lift
 * first. Derived from the sign of each axis only.
 */
export const CornerIndicator: React.FC<CornerIndicatorProps> = ({ pitch, roll, tolerance }) => {
  const leftLow = roll < -tolerance;
  const rightLow = roll > tolerance;
  const frontLow = pitch < -tolerance;
  const backLow = pitch > tolerance;

  const corners = [
    { id: 'FL', score: (leftLow ? 1 : 0) + (frontLow ? 1 : 0) },
    { id: 'FR', score: (rightLow ? 1 : 0) + (frontLow ? 1 : 0) },
    { id: 'RL', score: (leftLow ? 1 : 0) + (backLow ? 1 : 0) },
    { id: 'RR', score: (rightLow ? 1 : 0) + (backLow ? 1 : 0) },
  ];

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <span className="stencil text-[10px]" style={{ color: 'var(--ink-3)' }}>
        Front
      </span>

      <div className="grid grid-cols-2 gap-2.5">
        {corners.map((corner) => {
          const low = corner.score > 0;
          const lowest = corner.score === 2;
          return (
            <div
              key={corner.id}
              className="w-[34px] h-[50px] sm:w-[40px] sm:h-[58px]"
              style={{
                border: `2px solid ${low ? 'var(--amber)' : 'var(--line-strong)'}`,
                background: lowest ? 'var(--amber)' : 'transparent',
              }}
            />
          );
        })}
      </div>

      <span className="stencil text-[10px]" style={{ color: 'var(--ink-3)' }}>
        Low
      </span>
    </div>
  );
};
