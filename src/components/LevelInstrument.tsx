import React from 'react';
import { motion } from 'motion/react';

interface LevelInstrumentProps {
  pitch: number; // + = front high / back low
  roll: number; // + = left high / right low
  tolerance: number;
  isLevel: boolean;
}

const CX = 120;
const CY = 120;
const R_BEZEL = 115;
const R_FACE = 110;
const R_TRAVEL = 39; // ball travel, kept inside the van body so it never fouls a wheel
const BALL_R = 11;
// Levelling work happens almost entirely under 3 degrees, so that's full
// scale — beyond it the ball pins to the wall and picks up the off-scale ring.
const FULL_SCALE_DEG = 3;

const REFERENCE_DEGREES = [1, 2];

/** Van seen from above, nose at the top, with a slightly tapered front. */
const VAN_BODY = [
  `M ${CX - 39} ${CY - 94}`,
  `Q ${CX - 52} ${CY - 87} ${CX - 52} ${CY - 72}`,
  `L ${CX - 52} ${CY + 85}`,
  `Q ${CX - 52} ${CY + 94} ${CX - 43} ${CY + 94}`,
  `L ${CX + 43} ${CY + 94}`,
  `Q ${CX + 52} ${CY + 94} ${CX + 52} ${CY + 85}`,
  `L ${CX + 52} ${CY - 72}`,
  `Q ${CX + 52} ${CY - 87} ${CX + 39} ${CY - 94}`,
  'Z',
].join(' ');

export const LevelInstrument: React.FC<LevelInstrumentProps> = ({
  pitch,
  roll,
  tolerance,
  isLevel,
}) => {
  const scale = R_TRAVEL / FULL_SCALE_DEG;

  // The ball rolls downhill — it settles over the corner of the van that sits
  // lowest, which is the corner to lift. Positive roll = right side low;
  // positive pitch = back low.
  let bx = roll * scale;
  let by = pitch * scale;
  const magnitude = Math.hypot(bx, by);
  const offScale = magnitude > R_TRAVEL;
  if (offScale && magnitude > 0) {
    bx = (bx / magnitude) * R_TRAVEL;
    by = (by / magnitude) * R_TRAVEL;
  }

  const toleranceRadius = Math.max(BALL_R + 6, tolerance * scale);
  const accent = isLevel ? 'var(--level)' : 'var(--amber)';

  // Which corners sit low, from the sign of each axis alone.
  // 2 = low on both axes (lift this one first), 1 = low on one axis.
  const leftLow = roll < -tolerance;
  const rightLow = roll > tolerance;
  const frontLow = pitch < -tolerance;
  const backLow = pitch > tolerance;

  const wheels = [
    { id: 'FL', x: CX - 58, y: CY - 66, score: (leftLow ? 1 : 0) + (frontLow ? 1 : 0) },
    { id: 'FR', x: CX + 58, y: CY - 66, score: (rightLow ? 1 : 0) + (frontLow ? 1 : 0) },
    { id: 'RL', x: CX - 58, y: CY + 68, score: (leftLow ? 1 : 0) + (backLow ? 1 : 0) },
    { id: 'RR', x: CX + 58, y: CY + 68, score: (rightLow ? 1 : 0) + (backLow ? 1 : 0) },
  ];

  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full h-full"
      role="img"
      aria-label={`Tilt ${Math.abs(roll).toFixed(1)} degrees roll, ${Math.abs(pitch).toFixed(
        1
      )} degrees pitch`}
    >
      <defs>
        <radialGradient id="faceWell" cx="50%" cy="40%" r="74%">
          <stop offset="0%" stopColor="var(--panel)" />
          <stop offset="100%" stopColor="var(--well)" />
        </radialGradient>
        <radialGradient id="ballBody" cx="36%" cy="32%" r="74%">
          <stop offset="0%" stopColor={accent} stopOpacity="1" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
        </radialGradient>
        <filter id="ballGlow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="4.5" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
      </defs>

      {/* Bezel and perimeter graduations */}
      <circle cx={CX} cy={CY} r={R_BEZEL} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      {ticks.map((deg) => {
        const heavy = deg % 30 === 0;
        const rad = ((deg - 90) * Math.PI) / 180;
        const inner = R_BEZEL - (heavy ? 10 : 6);
        return (
          <line
            key={deg}
            x1={CX + Math.cos(rad) * inner}
            y1={CY + Math.sin(rad) * inner}
            x2={CX + Math.cos(rad) * (R_BEZEL - 1)}
            y2={CY + Math.sin(rad) * (R_BEZEL - 1)}
            stroke={heavy ? 'var(--line-strong)' : 'var(--line)'}
            strokeWidth={heavy ? 1.6 : 1}
          />
        );
      })}

      {/* Gauge face */}
      <circle cx={CX} cy={CY} r={R_FACE} fill="url(#faceWell)" stroke="var(--line)" strokeWidth="1" />

      {/* Wheels, drawn before the body so the body edge overlaps them cleanly */}
      {wheels.map((wheel) => {
        const active = wheel.score > 0;
        const critical = wheel.score === 2;
        return (
          <g key={wheel.id}>
            <rect
              x={wheel.x - 7}
              y={wheel.y - 14}
              width="14"
              height="28"
              rx="4"
              fill={active ? accent : 'var(--line-strong)'}
              fillOpacity={critical ? 0.95 : active ? 0.45 : 0.5}
              stroke={active ? accent : 'var(--line-strong)'}
              strokeWidth={critical ? 2 : 1}
            />
            {critical && (
              <rect
                x={wheel.x - 12}
                y={wheel.y - 19}
                width="24"
                height="38"
                rx="7"
                fill="none"
                stroke={accent}
                strokeWidth="1.25"
                strokeOpacity="0.55"
              />
            )}
          </g>
        );
      })}

      {/* Van body, seen from above */}
      <path d={VAN_BODY} fill="var(--well)" fillOpacity="0.55" stroke="var(--line-strong)" strokeWidth="1.5" />
      {/* Windscreen line marks the nose */}
      <path
        d={`M ${CX - 37} ${CY - 77} Q ${CX} ${CY - 85} ${CX + 37} ${CY - 77}`}
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="1.25"
      />

      {/* Reference rings at 1, 2 and 3 degrees */}
      {REFERENCE_DEGREES.map((deg) => (
        <circle
          key={deg}
          cx={CX}
          cy={CY}
          r={deg * scale}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}

      {/* Crosshair */}
      <line x1={CX - 44} y1={CY} x2={CX + 44} y2={CY} stroke="var(--line)" strokeWidth="1" />
      <line x1={CX} y1={CY - 62} x2={CX} y2={CY + 62} stroke="var(--line)" strokeWidth="1" />

      {/* Tolerance gate — land the ball inside this and you are level */}
      <circle
        cx={CX}
        cy={CY}
        r={toleranceRadius}
        fill={isLevel ? 'var(--level)' : 'none'}
        fillOpacity={isLevel ? 0.18 : 0}
        stroke={accent}
        strokeWidth="1.75"
        strokeOpacity={isLevel ? 0.9 : 0.5}
      />

      {/* Axis letters, just inside the bezel */}
      {[
        { label: 'F', x: CX, y: CY - R_FACE + 15 },
        { label: 'B', x: CX, y: CY + R_FACE - 5 },
        { label: 'L', x: CX - R_FACE + 11, y: CY + 4 },
        { label: 'R', x: CX + R_FACE - 11, y: CY + 4 },
      ].map((axis) => (
        <text
          key={axis.label}
          x={axis.x}
          y={axis.y}
          textAnchor="middle"
          className="stencil"
          fontSize="10"
          fill="var(--ink-3)"
        >
          {axis.label}
        </text>
      ))}

      {/* The ball */}
      <motion.g
        animate={{ x: bx, y: by }}
        transition={{ type: 'spring', damping: 26, stiffness: 170, mass: 0.7 }}
      >
        <circle cx={CX} cy={CY + 2} r={BALL_R} fill="#000" opacity="0.4" />
        <circle
          cx={CX}
          cy={CY}
          r={BALL_R}
          fill="url(#ballBody)"
          stroke={accent}
          strokeWidth="1.5"
          filter="url(#ballGlow)"
        />
        <circle cx={CX - 3.5} cy={CY - 4} r="3" fill="#fff" opacity="0.4" />
        {offScale && (
          <circle
            cx={CX}
            cy={CY}
            r={BALL_R + 5}
            fill="none"
            stroke={accent}
            strokeWidth="1.25"
            strokeDasharray="3 4"
            opacity="0.85"
          />
        )}
      </motion.g>
    </svg>
  );
};
