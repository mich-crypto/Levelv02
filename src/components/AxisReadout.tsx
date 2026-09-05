import React from 'react';

interface AxisReadoutProps {
  axis: string; // SIDE TO SIDE / FRONT TO BACK
  value: number; // signed degrees
  action: string; // e.g. RAISE RIGHT
  distanceCm: string;
  isLevel: boolean;
}

/** One axis: how far out it is, and what to do about it. Nothing else. */
export const AxisReadout: React.FC<AxisReadoutProps> = ({
  axis,
  value,
  action,
  distanceCm,
  isLevel,
}) => (
  <section className="flex flex-col justify-center min-w-0 gap-3">
    <span className="stencil text-[12px] leading-none" style={{ color: 'var(--ink-3)' }}>
      {axis}
    </span>

    <div className="flex items-baseline gap-1">
      <span
        className="readout text-[clamp(4.5rem,27vh,11rem)] font-semibold"
        style={{ color: isLevel ? 'var(--level)' : 'var(--ink)' }}
      >
        {Math.abs(value).toFixed(1)}
      </span>
      <span
        className="readout text-[clamp(2rem,9vh,4rem)] font-medium"
        style={{ color: 'var(--ink-3)' }}
      >
        °
      </span>
    </div>

    {isLevel ? (
      <span className="stencil text-[14px]" style={{ color: 'var(--level)' }}>
        In tolerance
      </span>
    ) : (
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="stencil text-[14px] px-3 py-2 truncate"
          style={{ background: 'var(--amber)', color: 'var(--ground)' }}
        >
          {action}
        </span>
        <span className="readout text-[clamp(1.6rem,5.5vh,2.6rem)] font-medium whitespace-nowrap">
          {distanceCm}
          <span className="text-[0.6em]" style={{ color: 'var(--ink-3)' }}>
            {' '}
            cm
          </span>
        </span>
      </div>
    )}
  </section>
);
