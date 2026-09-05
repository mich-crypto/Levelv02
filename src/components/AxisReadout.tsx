import React from 'react';
import { motion } from 'motion/react';

interface AxisReadoutProps {
  label: string; // ROLL / PITCH
  axis: string; // SIDE TO SIDE / FRONT TO BACK
  value: number; // signed degrees
  tolerance: number;
  negLabel: string; // end of the vial the ball moves to for a negative value
  posLabel: string;
  action: string; // e.g. RAISE RIGHT
  distanceCm: string;
  isLevel: boolean;
}

const VIAL_W = 220;
const VIAL_H = 40;
const FULL_SCALE_DEG = 3; // matches the dial

export const AxisReadout: React.FC<AxisReadoutProps> = ({
  label,
  axis,
  value,
  tolerance,
  negLabel,
  posLabel,
  action,
  distanceCm,
  isLevel,
}) => {
  const travel = VIAL_W / 2 - 26;
  const scale = travel / FULL_SCALE_DEG;
  const offset = Math.max(-travel, Math.min(travel, value * scale));
  const accent = isLevel ? 'var(--level)' : 'var(--amber)';
  const toleranceHalfWidth = Math.max(5, tolerance * scale);

  return (
    <section className="flex flex-col gap-2.5 min-w-0">
      <header className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="stencil text-[11px] leading-none" style={{ color: 'var(--ink-2)' }}>
            {label}
          </span>
          <span
            className="text-[10px] leading-none tracking-wide"
            style={{ color: 'var(--ink-3)' }}
          >
            {axis}
          </span>
        </div>

        <div className="flex items-baseline gap-0.5 shrink-0">
          <span
            className="readout text-[clamp(2.6rem,7vh,4.2rem)] font-semibold"
            style={{ color: isLevel ? 'var(--level)' : 'var(--ink)' }}
          >
            {Math.abs(value).toFixed(1)}
          </span>
          <span
            className="readout text-[clamp(1.7rem,4.4vh,2.6rem)] font-medium"
            style={{ color: 'var(--ink-3)' }}
          >
            °
          </span>
        </div>
      </header>

      {/* Linear vial — the weight settles toward the low end */}
      <svg viewBox={`0 0 ${VIAL_W} ${VIAL_H}`} className="w-full" aria-hidden="true">
        <rect
          x="1"
          y="9"
          width={VIAL_W - 2}
          height={VIAL_H - 18}
          rx={(VIAL_H - 18) / 2}
          fill="var(--well)"
          stroke="var(--line)"
          strokeWidth="1"
        />

        {/* Graduations every half degree */}
        {Array.from({ length: 21 }, (_, i) => (i - 10) * 0.25).map((deg) => {
          const heavy = Number.isInteger(deg);
          const x = VIAL_W / 2 + deg * scale;
          if (x < 6 || x > VIAL_W - 6) return null;
          return (
            <line
              key={deg}
              x1={x}
              y1={heavy ? 13 : 15}
              x2={x}
              y2={heavy ? VIAL_H - 13 : VIAL_H - 15}
              stroke="var(--line)"
              strokeWidth={heavy ? 1.2 : 0.8}
            />
          );
        })}

        {/* Tolerance gate at centre */}
        <rect
          x={VIAL_W / 2 - toleranceHalfWidth}
          y="9"
          width={toleranceHalfWidth * 2}
          height={VIAL_H - 18}
          fill={isLevel ? 'var(--level)' : 'var(--amber)'}
          fillOpacity={isLevel ? 0.16 : 0.07}
        />
        <line
          x1={VIAL_W / 2 - toleranceHalfWidth}
          y1="9"
          x2={VIAL_W / 2 - toleranceHalfWidth}
          y2={VIAL_H - 9}
          stroke={accent}
          strokeWidth="1.25"
          strokeOpacity="0.7"
        />
        <line
          x1={VIAL_W / 2 + toleranceHalfWidth}
          y1="9"
          x2={VIAL_W / 2 + toleranceHalfWidth}
          y2={VIAL_H - 9}
          stroke={accent}
          strokeWidth="1.25"
          strokeOpacity="0.7"
        />

        <motion.circle
          cx={VIAL_W / 2}
          cy={VIAL_H / 2}
          r="8.5"
          fill={accent}
          stroke={accent}
          strokeWidth="1"
          animate={{ x: offset }}
          transition={{ type: 'spring', damping: 26, stiffness: 170, mass: 0.7 }}
        />
      </svg>

      <footer className="flex items-end justify-between gap-3">
        <span className="stencil text-[10px]" style={{ color: 'var(--ink-3)' }}>
          {negLabel}
        </span>

        <div className="flex flex-col items-center gap-0.5 text-center min-w-0">
          {isLevel ? (
            <span className="stencil text-[11px]" style={{ color: 'var(--level)' }}>
              In tolerance
            </span>
          ) : (
            <>
              <span className="stencil text-[11px] truncate" style={{ color: 'var(--amber)' }}>
                {action}
              </span>
              <span
                className="readout text-[clamp(1rem,2.4vh,1.35rem)] font-medium"
                style={{ color: 'var(--ink-2)' }}
              >
                {distanceCm} cm
              </span>
            </>
          )}
        </div>

        <span className="stencil text-[10px]" style={{ color: 'var(--ink-3)' }}>
          {posLabel}
        </span>
      </footer>
    </section>
  );
};
