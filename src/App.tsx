import React, { useState, useEffect } from 'react';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { audioAssistant } from './utils/audioAssistant';
import { SimpleVehicleView } from './components/SimpleVehicleView';
import { OptionsModal } from './components/OptionsModal';
import { CompassSunriseBadge } from './components/CompassSunriseBadge';
import { VehicleConfig } from './types';
import { 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Target, 
  RotateCcw, 
  Ruler
} from 'lucide-react';

export default function App() {
  const {
    orientation,
    hasSensor,
    calibration,
    setZeroCalibration,
    resetCalibration,
    isSimulating,
    setIsSimulating,
    simulatedPitch,
    setSimulatedPitch,
    simulatedRoll,
    setSimulatedRoll,
  } = useDeviceOrientation();

  // Vehicle Dimensions Config (Wheelbase, Track Width, & Tolerance)
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(() => {
    try {
      const saved = localStorage.getItem('camper_vehicle_config_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { wheelbaseCm: 403.5, trackWidthCm: 181.0, toleranceDeg: 0.4 };
  });

  // Options Modal State
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);

  const handleSaveConfig = (newConfig: VehicleConfig) => {
    setVehicleConfig(newConfig);
    try {
      localStorage.setItem('camper_vehicle_config_v1', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  // Night / Day Mode
  const [isDayMode, setIsDayMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('camper_day_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Sound alert when nearing zero
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  const pitch = orientation.pitch;
  const roll = orientation.roll;
  const tolerance = vehicleConfig.toleranceDeg ?? 0.4;
  const totalTilt = Math.sqrt(pitch * pitch + roll * roll);
  const isLevel = Math.abs(pitch) <= tolerance && Math.abs(roll) <= tolerance;

  // Toggle Day / Night Mode
  const toggleDayMode = () => {
    const next = !isDayMode;
    setIsDayMode(next);
    try {
      localStorage.setItem('camper_day_mode', next.toString());
    } catch {
      // ignore
    }
  };

  // Audio Assistant Toggle with automatic unlock
  const handleToggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    audioAssistant.setEnabled(next);
  };

  // Keep Audio Assistant updated with current pitch/roll
  useEffect(() => {
    audioAssistant.updateTilt(pitch, roll, tolerance);
  }, [pitch, roll, tolerance]);

  return (
    <div
      id="camper-level-single-page"
      className={`h-[100dvh] max-h-[100dvh] w-screen flex flex-col justify-between p-2.5 sm:p-4 md:p-5 font-sans select-none overflow-hidden touch-manipulation transition-colors duration-200 ${
        isDayMode
          ? 'bg-slate-100 text-slate-900'
          : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* 1. TOP HEADER / ACTION BAR */}
      <header className="w-full flex items-center justify-between gap-2 pb-2 border-b border-neutral-700/20">
        {/* Title & Status */}
        <div className="flex items-center gap-2">
          {/* Citroën Double Chevron Emblem */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 flex items-center justify-center shadow shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-neutral-200" fill="currentColor">
              <path d="M 4 8 L 12 2 L 20 8 L 16 11 L 12 8 L 8 11 Z" />
              <path d="M 4 16 L 12 10 L 20 16 L 16 19 L 12 16 L 8 19 Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight leading-tight uppercase">
              Vehicle Level
            </h1>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] opacity-85">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${
                    hasSensor ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    hasSensor
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
              </span>
              <span
                className={`font-semibold ${
                  hasSensor ? 'text-emerald-400' : isSimulating ? 'text-amber-400' : 'text-neutral-400'
                }`}
              >
                {hasSensor
                  ? 'Android Gyro Active'
                  : isSimulating
                  ? 'Manual Mode'
                  : 'Sensor Active'}
              </span>
              {calibration.isCalibrated && (
                <span className="text-emerald-500 font-bold">• Calibrated</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Sound, Night/Day, Options, Simple Calibrate */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Alert Toggle */}
          <button
            id="toggle-audio-btn"
            onClick={handleToggleAudio}
            className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
              isAudioEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : isDayMode
                ? 'bg-white border-slate-300 text-slate-400 hover:text-slate-700'
                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
            title="Sound alert when nearing zero"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">Sound</span>
          </button>

          {/* Night / Day Mode Toggle */}
          <button
            id="toggle-theme-btn"
            onClick={toggleDayMode}
            className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
              isDayMode
                ? 'bg-white border-slate-300 text-slate-700 shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Switch Night and Day Mode"
          >
            {isDayMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">{isDayMode ? 'Day' : 'Night'}</span>
          </button>

          {/* Options / Wheelbase Button */}
          <button
            id="open-options-btn"
            onClick={() => {
              audioAssistant.initCtx();
              setIsOptionsOpen(true);
            }}
            className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
              isDayMode
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Configure Wheelbase & Track Width"
          >
            <Ruler className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline text-[11px]">Options</span>
          </button>

          {/* Simple Calibrate Button (Tare Zero) */}
          <button
            id="calibrate-zero-btn"
            onClick={() => {
              audioAssistant.initCtx();
              setZeroCalibration();
            }}
            className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${
              calibration.isCalibrated
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : isDayMode
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'bg-neutral-100 text-neutral-900 border border-neutral-300'
            }`}
            title="Set Current Orientation as Level (0.0°)"
          >
            <Target className="w-4 h-4" />
            <span>Calibrate</span>
          </button>

          {/* Reset Calibration if active */}
          {calibration.isCalibrated && (
            <button
              id="reset-calib-btn"
              onClick={resetCalibration}
              className={`p-2 sm:p-2.5 rounded-xl border text-xs transition-all active:scale-95 ${
                isDayMode
                  ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Reset Calibration to Factory 0°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN VEHICLE GAUGE CARDS (FRONT & SIDE) */}
      <main className="w-full flex-1 flex flex-col justify-center min-h-0 py-1">
        <SimpleVehicleView
          pitch={pitch}
          roll={roll}
          isDayMode={isDayMode}
          config={vehicleConfig}
        />
      </main>

      {/* 3. BOTTOM UTILITY DOCK */}
      <footer className="w-full flex items-center justify-end pt-2 border-t border-neutral-700/20">
        {/* Global Compass & Sunrise Direction Badge */}
        <div className="flex items-center gap-2">
          {isLevel ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Camper is Level
            </span>
          ) : (
            <CompassSunriseBadge yaw={orientation.yaw} isDayMode={isDayMode} />
          )}
        </div>
      </footer>

      {/* Options Modal */}
      <OptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        config={vehicleConfig}
        onSaveConfig={handleSaveConfig}
        isDayMode={isDayMode}
      />
    </div>
  );
}
