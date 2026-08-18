import React, { useState } from 'react';
import {
  X,
  Check,
  Ruler,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { VehicleConfig } from '../types';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VehicleConfig;
  onSaveConfig: (newConfig: VehicleConfig) => void;
  isDayMode: boolean;
}

interface Preset {
  name: string;
  sub: string;
  wheelbaseCm: number;
  trackWidthCm: number;
}

const PRESETS: Preset[] = [
  {
    name: 'Citroën Jumper / Ducato L3/L4',
    sub: 'Wheelbase 403.5 cm • Track 181 cm',
    wheelbaseCm: 403.5,
    trackWidthCm: 181.0,
  },
  {
    name: 'Citroën Jumper / Ducato L2',
    sub: 'Wheelbase 345 cm • Track 181 cm',
    wheelbaseCm: 345.0,
    trackWidthCm: 181.0,
  },
  {
    name: 'Citroën Jumper / Ducato L1',
    sub: 'Wheelbase 300 cm • Track 181 cm',
    wheelbaseCm: 300.0,
    trackWidthCm: 181.0,
  },
  {
    name: 'Mercedes Sprinter / Crafter (Medium)',
    sub: 'Wheelbase 366.5 cm • Track 173 cm',
    wheelbaseCm: 366.5,
    trackWidthCm: 173.0,
  },
  {
    name: 'Mercedes Sprinter / Crafter (Long)',
    sub: 'Wheelbase 432.5 cm • Track 173 cm',
    wheelbaseCm: 432.5,
    trackWidthCm: 173.0,
  },
  {
    name: 'VW Transporter / T5 / T6',
    sub: 'Wheelbase 300 cm • Track 162.8 cm',
    wheelbaseCm: 300.0,
    trackWidthCm: 162.8,
  },
];

const TOLERANCE_PRESETS = [
  { label: 'Strict (±0.2°)', value: 0.2 },
  { label: 'Standard (±0.4°)', value: 0.4 },
  { label: 'Comfort (±0.6°)', value: 0.6 },
  { label: 'Relaxed (±1.0°)', value: 1.0 },
];

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isDayMode,
}) => {
  const [wheelbase, setWheelbase] = useState<string>(config.wheelbaseCm.toString());
  const [trackWidth, setTrackWidth] = useState<string>(config.trackWidthCm.toString());
  const [tolerance, setTolerance] = useState<number>(config.toleranceDeg ?? 0.4);

  if (!isOpen) return null;

  const handleSave = () => {
    const wb = parseFloat(wheelbase) || 403.5;
    const tw = parseFloat(trackWidth) || 181.0;
    const tol = Number(tolerance) || 0.4;
    onSaveConfig({
      wheelbaseCm: Math.max(100, Math.min(800, wb)),
      trackWidthCm: Math.max(80, Math.min(300, tw)),
      toleranceDeg: Math.max(0.1, Math.min(2.0, tol)),
    });
    onClose();
  };

  const handleApplyPreset = (preset: Preset) => {
    setWheelbase(preset.wheelbaseCm.toString());
    setTrackWidth(preset.trackWidthCm.toString());
  };

  return (
    <div
      id="options-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="options-modal-card"
        className={`w-full max-w-lg rounded-2xl border p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90dvh] overflow-y-auto overscroll-contain ${
          isDayMode
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-neutral-900 border-neutral-800 text-neutral-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-700/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Vehicle Dimensions & Tolerance
              </h2>
              <p className="text-xs opacity-60">
                Configure wheelbase and track width for accurate cm ramp calculations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800/40 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Leveling Tolerance Section (Slider) */}
        <div
          className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isDayMode ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold uppercase tracking-wider">
                Leveling Tolerance
              </label>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
              ±{tolerance.toFixed(1)}°
            </span>
          </div>

          {/* Slider */}
          <div className="flex flex-col gap-1.5">
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={tolerance}
              onChange={(e) => setTolerance(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-neutral-700 rounded-lg appearance-none"
            />
            <div className="flex items-center justify-between text-[10px] font-mono opacity-50 px-0.5">
              <span>0.1° (High precision)</span>
              <span>2.0° (Relaxed)</span>
            </div>
          </div>

          {/* Tolerance Quick Select Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {TOLERANCE_PRESETS.map((tp) => {
              const isSelected = Math.abs(tolerance - tp.value) < 0.04;
              return (
                <button
                  key={tp.label}
                  type="button"
                  onClick={() => setTolerance(tp.value)}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                      : isDayMode
                      ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  {tp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Vehicle Dimensions Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wheelbase Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              Wheelbase (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="100"
                max="800"
                value={wheelbase}
                onChange={(e) => setWheelbase(e.target.value)}
                placeholder="e.g. 403.5"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono font-bold outline-none transition-all ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-emerald-500 focus:bg-neutral-900'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-40">
                cm
              </span>
            </div>
            <span className="text-[11px] opacity-50">
              Front axle to rear axle distance
            </span>
          </div>

          {/* Track Width Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              Track Width (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="80"
                max="300"
                value={trackWidth}
                onChange={(e) => setTrackWidth(e.target.value)}
                placeholder="e.g. 181.0"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base font-mono font-bold outline-none transition-all ${
                  isDayMode
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-emerald-500 focus:bg-neutral-900'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-40">
                cm
              </span>
            </div>
            <span className="text-[11px] opacity-50">
              Left wheel to right wheel distance
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700/20">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            Quick Van Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const isSelected =
                parseFloat(wheelbase) === p.wheelbaseCm &&
                parseFloat(trackWidth) === p.trackWidthCm;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all text-xs ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold shadow-sm'
                      : isDayMode
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{p.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] opacity-60 font-mono">{p.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-700/20">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              isDayMode
                ? 'border-slate-300 text-slate-600 hover:bg-slate-100'
                : 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            Cancel
          </button>

          <button
            id="save-wheelbase-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
