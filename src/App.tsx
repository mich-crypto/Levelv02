import React, { useState, useEffect } from 'react';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { audioAssistant } from './utils/audioAssistant';
import { SimpleVehicleView } from './components/SimpleVehicleView';
import { OptionsModal } from './components/OptionsModal';
import { CompassSunriseBadge } from './components/CompassSunriseBadge';
import { VehicleConfig } from './types';
import { Volume2, VolumeX, Sun, Moon, SlidersHorizontal, Crosshair, RotateCcw } from 'lucide-react';

interface RailButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  label?: string;
}

const RailButton: React.FC<RailButtonProps> = ({ onClick, active, title, children, label }) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className="h-10 px-2.5 sm:px-3 flex items-center gap-2 transition-colors active:scale-[0.97]"
    style={{
      color: active ? 'var(--amber)' : 'var(--ink-2)',
      border: '1px solid',
      borderColor: active ? 'var(--amber-dim)' : 'var(--line)',
      background: active ? 'color-mix(in srgb, var(--amber) 10%, transparent)' : 'transparent',
    }}
  >
    {children}
    {label && <span className="stencil text-[10px] hidden lg:inline">{label}</span>}
  </button>
);

export default function App() {
  const {
    orientation,
    hasSensor,
    calibration,
    setZeroCalibration,
    resetCalibration,
    needsMotionPermission,
    motionPermissionGranted,
    requestMotionPermission,
  } = useDeviceOrientation();

  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(() => {
    try {
      const saved = localStorage.getItem('camper_vehicle_config_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { wheelbaseCm: 403.5, trackWidthCm: 181.0, toleranceDeg: 0.4 };
  });

  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);

  const handleSaveConfig = (newConfig: VehicleConfig) => {
    setVehicleConfig(newConfig);
    try {
      localStorage.setItem('camper_vehicle_config_v1', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  const [isDayMode, setIsDayMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('camper_day_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  const pitch = orientation.pitch;
  const roll = orientation.roll;
  const tolerance = vehicleConfig.toleranceDeg ?? 0.4;
  const totalTilt = Math.hypot(pitch, roll);
  const isLevel = Math.abs(pitch) <= tolerance && Math.abs(roll) <= tolerance;

  const toggleDayMode = () => {
    const next = !isDayMode;
    setIsDayMode(next);
    try {
      localStorage.setItem('camper_day_mode', next.toString());
    } catch {
      // ignore
    }
  };

  const handleToggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    audioAssistant.setEnabled(next);
  };

  // iOS Safari gates motion sensors behind a tap. Ask for it and unlock audio
  // in the same gesture.
  const handleEnableMotion = async () => {
    audioAssistant.initCtx();
    await requestMotionPermission();
  };

  useEffect(() => {
    audioAssistant.updateTilt(pitch, roll, tolerance);
  }, [pitch, roll, tolerance]);

  return (
    <div
      id="camper-level-single-page"
      data-mode={isDayMode ? 'day' : 'night'}
      className="h-[100dvh] max-h-[100dvh] w-screen flex flex-col select-none overflow-hidden touch-manipulation px-3 sm:px-5"
      style={{ background: 'var(--ground)', color: 'var(--ink)' }}
    >
      {/* ---- TOP RAIL ---- */}
      <header className="shrink-0 flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
            <line x1="12" y1="4.5" x2="12" y2="19.5" stroke="var(--line)" strokeWidth="1" />
            <line x1="4.5" y1="12" x2="19.5" y2="12" stroke="var(--line)" strokeWidth="1" />
            <circle cx="12" cy="12" r="4" fill="none" stroke="var(--amber)" strokeWidth="1.25" />
            <circle cx="12" cy="12" r="2" fill="var(--amber)" />
          </svg>

          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="stencil text-[12px] sm:text-[13px] leading-none" style={{ color: 'var(--ink)' }}>
              Vehicle Level
            </h1>
            <div className="flex items-center gap-2.5 text-[10px] leading-none whitespace-nowrap">
              <span style={{ color: hasSensor ? 'var(--ink-2)' : 'var(--amber)' }}>
                {hasSensor ? 'Sensor live' : 'No sensor signal'}
              </span>
              <span style={{ color: 'var(--line-strong)' }}>/</span>
              <span style={{ color: calibration.isCalibrated ? 'var(--ink-2)' : 'var(--amber)' }}>
                {calibration.isCalibrated
                  ? `Zeroed ${calibration.calibratedAt ?? ''}`.trim()
                  : 'Not zeroed'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <RailButton
            onClick={handleToggleAudio}
            active={isAudioEnabled}
            title="Audio level guidance"
            label="Sound"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </RailButton>

          <RailButton onClick={toggleDayMode} title="Day or night panel lighting" label={isDayMode ? 'Day' : 'Night'}>
            {isDayMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </RailButton>

          <RailButton
            onClick={() => {
              audioAssistant.initCtx();
              setIsOptionsOpen(true);
            }}
            title="Vehicle dimensions and tolerance"
            label="Setup"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </RailButton>

          {calibration.isCalibrated && (
            <RailButton onClick={resetCalibration} title="Clear the stored zero point">
              <RotateCcw className="w-4 h-4" />
            </RailButton>
          )}

          <button
            onClick={() => {
              audioAssistant.initCtx();
              setZeroCalibration();
            }}
            title="Set the current orientation as level"
            className="h-10 px-4 flex items-center gap-2 transition-colors active:scale-[0.97]"
            style={{
              background: 'var(--amber)',
              color: 'var(--ground)',
              border: '1px solid var(--amber)',
            }}
          >
            <Crosshair className="w-4 h-4" />
            <span className="stencil text-[11px]">Calibrate</span>
          </button>
        </div>
      </header>

      <div className="seam h-px shrink-0" />

      {/* iOS Safari needs a tap before it will release the sensors */}
      {needsMotionPermission && !motionPermissionGranted && (
        <div
          className="shrink-0 mt-2.5 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
          style={{
            border: '1px solid var(--amber-dim)',
            background: 'color-mix(in srgb, var(--amber) 8%, transparent)',
            color: 'var(--ink)',
          }}
        >
          <span>This browser needs permission before it will report tilt.</span>
          <button
            onClick={handleEnableMotion}
            className="stencil shrink-0 px-3 h-8 text-[10px]"
            style={{ background: 'var(--amber)', color: 'var(--ground)' }}
          >
            Enable sensors
          </button>
        </div>
      )}

      {/* ---- INSTRUMENTS ---- */}
      <main className="flex-1 min-h-0 flex items-center justify-center py-3">
        <SimpleVehicleView pitch={pitch} roll={roll} config={vehicleConfig} />
      </main>

      <div className="seam h-px shrink-0" />

      {/* ---- VERDICT RAIL ---- */}
      <footer className="shrink-0 flex items-center justify-between gap-4 py-2.5">
        <div className="flex items-baseline gap-3 min-w-0">
          <span
            className="stencil text-[13px] sm:text-[15px] leading-none"
            style={{ color: isLevel ? 'var(--level)' : 'var(--amber)' }}
          >
            {isLevel ? 'Level' : 'Out of level'}
          </span>
          <span className="readout text-[15px] font-medium" style={{ color: 'var(--ink-2)' }}>
            {totalTilt.toFixed(1)}°
          </span>
          <span className="text-[10px] leading-none hidden sm:inline" style={{ color: 'var(--ink-3)' }}>
            tolerance ±{tolerance.toFixed(1)}°
          </span>
        </div>

        <CompassSunriseBadge yaw={orientation.yaw} />
      </footer>

      <OptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        config={vehicleConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
