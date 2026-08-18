import React from 'react';
import { motion } from 'motion/react';
import { ArrowUp, Check } from 'lucide-react';
import { VehicleConfig } from '../types';

interface SimpleVehicleViewProps {
  pitch: number; // Front/rear in degrees (+ = Front high / Back low)
  roll: number;  // Left/right in degrees (+ = Left high / Right low)
  isDayMode: boolean;
  config: VehicleConfig;
}

export const SimpleVehicleView: React.FC<SimpleVehicleViewProps> = ({
  pitch,
  roll,
  isDayMode,
  config,
}) => {
  const tolerance = config.toleranceDeg ?? 0.4;
  const isRollLevel = Math.abs(roll) <= tolerance;
  const isPitchLevel = Math.abs(pitch) <= tolerance;

  // Clamped rotation for clean rendering
  const clampedRoll = Math.max(-12, Math.min(12, roll));
  const clampedPitch = Math.max(-12, Math.min(12, pitch));

  // Compute precise lift in cm based on track width and wheelbase
  const rollRad = (Math.abs(roll) * Math.PI) / 180;
  const pitchRad = (Math.abs(pitch) * Math.PI) / 180;

  const rollCm = (config.trackWidthCm * Math.sin(rollRad)).toFixed(1);
  const pitchCm = (config.wheelbaseCm * Math.sin(pitchRad)).toFixed(1);

  // Logic:
  // Roll > 0: Left is high, Right is low -> MUST RAISE RIGHT
  // Roll < 0: Right is high, Left is low -> MUST RAISE LEFT
  const rollAction = roll > 0 ? `Raise Right +${rollCm} cm` : `Raise Left +${rollCm} cm`;
  const rollStatus = roll > 0 ? 'Left is too high' : 'Right is too high';

  // Pitch > 0: Front is high, Back is low -> MUST RAISE BACK
  // Pitch < 0: Back is high, Front is low -> MUST RAISE FRONT
  const pitchAction = pitch > 0 ? `Raise Back +${pitchCm} cm` : `Raise Front +${pitchCm} cm`;
  const pitchStatus = pitch > 0 ? 'Front is too high' : 'Back is too high';

  return (
    <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch min-h-0 my-1">
      
      {/* ============================================================ */}
      {/* 1. FRONT AXLE & TIRES (ROLL / LEFT & RIGHT) */}
      {/* ============================================================ */}
      <div
        id="gauge-front"
        className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-center border transition-colors duration-200 ${
          isDayMode
            ? isRollLevel
              ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : isRollLevel
            ? 'bg-emerald-950/20 border-emerald-500/40 text-neutral-100'
            : 'bg-neutral-900/90 border-neutral-800 text-neutral-100 shadow-sm'
        }`}
      >
        {/* Card Header: Simple Label & Big Degree Display */}
        <div className="w-full flex items-center justify-between z-10">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase opacity-70 block">
              FRONT (ROLL)
            </span>
            <span className="text-[11px] font-mono opacity-50">
              {isRollLevel ? 'BALANCED' : rollStatus}
            </span>
          </div>

          {/* Big Clean Degrees Readout */}
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${
                isRollLevel
                  ? 'text-emerald-500'
                  : isDayMode
                  ? 'text-slate-900'
                  : 'text-white'
              }`}
            >
              {Math.abs(roll).toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Minimalist Geometric Drivetrain (Front Axle & 2 Tires) */}
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[130px] my-2">
          
          {/* Subtle Horizon Level Reference Line */}
          <div
            className={`absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] pointer-events-none ${
              isDayMode ? 'bg-slate-300' : 'bg-neutral-700/60'
            }`}
          />

          {/* Rotating Front Drivetrain: Axle + 2 Tires aligned with horizon at y=60 */}
          <motion.div
            className="relative w-full max-w-[280px] sm:max-w-[310px] h-32 flex items-center justify-center select-none"
            animate={{ rotate: clampedRoll }}
            transition={{ type: 'spring', damping: 22, stiffness: 140 }}
          >
            <svg viewBox="0 0 280 120" className="w-full h-full overflow-visible">
              <defs>
                <filter id="glow-arrow-front" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Left / Right Tire Labels (Above Tires) */}
              <text
                x="33"
                y="16"
                fill={isDayMode ? '#64748b' : '#a3a3a3'}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="monospace"
              >
                LEFT
              </text>
              <text
                x="247"
                y="16"
                fill={isDayMode ? '#64748b' : '#a3a3a3'}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="monospace"
              >
                RIGHT
              </text>

              {/* Solid Front Drive Axle Bar (Aligned exactly with Horizon at y=60) */}
              <line
                x1="36"
                y1="60"
                x2="244"
                y2="60"
                stroke={isRollLevel ? '#10b981' : isDayMode ? '#475569' : '#94a3b8'}
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Center Differential Node (Center y=60) */}
              <circle
                cx="140"
                cy="60"
                r="10"
                fill={isRollLevel ? '#10b981' : isDayMode ? '#334155' : '#e2e8f0'}
              />
              <circle
                cx="140"
                cy="60"
                r="4"
                fill={isDayMode ? '#ffffff' : '#0a0a0a'}
              />

              {/* Left Tire (Height 68, centered at y=60: from y=26 to y=94) */}
              <rect
                x="22"
                y="26"
                width="22"
                height="68"
                rx="6"
                fill={isRollLevel ? '#10b981' : isDayMode ? '#1e293b' : '#262626'}
                stroke={isRollLevel ? '#059669' : isDayMode ? '#0f172a' : '#525252'}
                strokeWidth="2"
              />
              <rect
                x="28"
                y="42"
                width="10"
                height="36"
                rx="2"
                fill={isDayMode ? '#ffffff' : '#0a0a0a'}
                opacity={isRollLevel ? 0.3 : 0.6}
              />

              {/* Right Tire (Height 68, centered at y=60: from y=26 to y=94) */}
              <rect
                x="236"
                y="26"
                width="22"
                height="68"
                rx="6"
                fill={isRollLevel ? '#10b981' : isDayMode ? '#1e293b' : '#262626'}
                stroke={isRollLevel ? '#059669' : isDayMode ? '#0f172a' : '#525252'}
                strokeWidth="2"
              />
              <rect
                x="242"
                y="42"
                width="10"
                height="36"
                rx="2"
                fill={isDayMode ? '#ffffff' : '#0a0a0a'}
                opacity={isRollLevel ? 0.3 : 0.6}
              />

              {/* UPWARD LIFT ARROW INDICATORS FURTHER FROM TIRES (Vertically Aligned, Clean Upward Arrow) */}
              {/* If roll < 0 -> Left wheel is low, RAISE LEFT */}
              {!isRollLevel && roll < 0 && (
                <g filter="url(#glow-arrow-front)">
                  <motion.g
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  >
                    {/* Clean Vertical Upward Arrow (Centered at x=33, positioned further down at y=101..119) */}
                    <path
                      d="M 33 101 L 40 109 L 36 109 L 36 119 L 30 119 L 30 109 L 26 109 Z"
                      fill="#10b981"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                </g>
              )}

              {/* If roll > 0 -> Right wheel is low, RAISE RIGHT */}
              {!isRollLevel && roll > 0 && (
                <g filter="url(#glow-arrow-front)">
                  <motion.g
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  >
                    {/* Clean Vertical Upward Arrow (Centered at x=247, positioned further down at y=101..119) */}
                    <path
                      d="M 247 101 L 254 109 L 250 109 L 250 119 L 244 119 L 244 109 L 240 109 Z"
                      fill="#10b981"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                </g>
              )}
            </svg>
          </motion.div>
        </div>

        {/* Clear Action State: Shows wheel and calculated cm height needed */}
        <div className="w-full flex items-center justify-start text-xs font-semibold pt-2 border-t border-neutral-700/10">
          <div className="flex items-center gap-1.5">
            {isRollLevel ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-bold text-sm tracking-tight">Level</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm tracking-tight">{rollAction}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SIDE CHASSIS & TIRES (PITCH / FRONT & BACK) */}
      {/* ============================================================ */}
      <div
        id="gauge-side"
        className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-center border transition-colors duration-200 ${
          isDayMode
            ? isPitchLevel
              ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : isPitchLevel
            ? 'bg-emerald-950/20 border-emerald-500/40 text-neutral-100'
            : 'bg-neutral-900/90 border-neutral-800 text-neutral-100 shadow-sm'
        }`}
      >
        {/* Card Header: Simple Label & Big Degree Display */}
        <div className="w-full flex items-center justify-between z-10">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase opacity-70 block">
              SIDE (PITCH)
            </span>
            <span className="text-[11px] font-mono opacity-50">
              {isPitchLevel ? 'BALANCED' : pitchStatus}
            </span>
          </div>

          {/* Big Clean Degrees Readout */}
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${
                isPitchLevel
                  ? 'text-emerald-500'
                  : isDayMode
                  ? 'text-slate-900'
                  : 'text-white'
              }`}
            >
              {Math.abs(pitch).toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Minimalist Geometric Drivetrain (Extended Long Wheelbase & Matching 68px Tires) */}
        <div className="relative w-full flex-1 flex items-center justify-center min-h-[130px] my-2">
          
          {/* Subtle Horizon Level Reference Line */}
          <div
            className={`absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] pointer-events-none ${
              isDayMode ? 'bg-slate-300' : 'bg-neutral-700/60'
            }`}
          />

          {/* Rotating Side Drivetrain: Chassis line aligned exactly with horizon at y=60 */}
          <motion.div
            className="relative w-full max-w-[280px] sm:max-w-[310px] h-32 flex items-center justify-center select-none"
            animate={{ rotate: clampedPitch }}
            transition={{ type: 'spring', damping: 22, stiffness: 140 }}
          >
            <svg viewBox="0 0 280 120" className="w-full h-full overflow-visible">
              <defs>
                <filter id="glow-arrow-side" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Front / Back Labels (Above Wheels) */}
              <text
                x="38"
                y="16"
                fill={isDayMode ? '#64748b' : '#a3a3a3'}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="monospace"
              >
                FRONT
              </text>
              <text
                x="242"
                y="16"
                fill={isDayMode ? '#64748b' : '#a3a3a3'}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="monospace"
              >
                BACK
              </text>

              {/* Solid Longitudinal Chassis Rail (Aligned exactly with Horizon at y=60) */}
              <line
                x1="36"
                y1="60"
                x2="244"
                y2="60"
                stroke={isPitchLevel ? '#10b981' : isDayMode ? '#475569' : '#94a3b8'}
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Front Wheel & Tire (Diameter 68, center y=60) */}
              <circle
                cx="38"
                cy="60"
                r="34"
                fill={isPitchLevel ? '#10b981' : isDayMode ? '#1e293b' : '#262626'}
                stroke={isPitchLevel ? '#059669' : isDayMode ? '#0f172a' : '#525252'}
                strokeWidth="2"
              />
              <circle
                cx="38"
                cy="60"
                r="14"
                fill={isDayMode ? '#ffffff' : '#0a0a0a'}
                opacity={isPitchLevel ? 0.3 : 0.6}
              />

              {/* Back / Rear Wheel & Tire (Diameter 68, center y=60) */}
              <circle
                cx="242"
                cy="60"
                r="34"
                fill={isPitchLevel ? '#10b981' : isDayMode ? '#1e293b' : '#262626'}
                stroke={isPitchLevel ? '#059669' : isDayMode ? '#0f172a' : '#525252'}
                strokeWidth="2"
              />
              <circle
                cx="242"
                cy="60"
                r="14"
                fill={isDayMode ? '#ffffff' : '#0a0a0a'}
                opacity={isPitchLevel ? 0.3 : 0.6}
              />

              {/* UPWARD LIFT ARROW INDICATORS FURTHER FROM WHEELS (Vertically Aligned, Clean Upward Arrow) */}
              {/* If pitch < 0 -> Front wheel is low, RAISE FRONT */}
              {!isPitchLevel && pitch < 0 && (
                <g filter="url(#glow-arrow-side)">
                  <motion.g
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  >
                    {/* Clean Vertical Upward Arrow (Centered at x=38, positioned further down at y=101..119) */}
                    <path
                      d="M 38 101 L 45 109 L 41 109 L 41 119 L 35 119 L 35 109 L 31 109 Z"
                      fill="#10b981"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                </g>
              )}

              {/* If pitch > 0 -> Back wheel is low, RAISE BACK */}
              {!isPitchLevel && pitch > 0 && (
                <g filter="url(#glow-arrow-side)">
                  <motion.g
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  >
                    {/* Clean Vertical Upward Arrow (Centered at x=242, positioned further down at y=101..119) */}
                    <path
                      d="M 242 101 L 249 109 L 245 109 L 245 119 L 239 119 L 239 109 L 235 109 Z"
                      fill="#10b981"
                      stroke="#059669"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                </g>
              )}
            </svg>
          </motion.div>
        </div>

        {/* Clear Action State: Shows wheel and calculated cm height needed */}
        <div className="w-full flex items-center justify-start text-xs font-semibold pt-2 border-t border-neutral-700/10">
          <div className="flex items-center gap-1.5">
            {isPitchLevel ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-bold text-sm tracking-tight">Level</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm tracking-tight">{pitchAction}</span>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
