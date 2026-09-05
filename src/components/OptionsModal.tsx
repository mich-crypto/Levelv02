import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { VehicleConfig } from '../types';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VehicleConfig;
  onSaveConfig: (newConfig: VehicleConfig) => void;
}

interface Preset {
  name: string;
  sub: string;
  wheelbaseCm: number;
  trackWidthCm: number;
}

const PRESETS: Preset[] = [
  { name: 'Jumper / Ducato L3–L4', sub: '403.5 × 181.0', wheelbaseCm: 403.5, trackWidthCm: 181.0 },
  { name: 'Jumper / Ducato L2', sub: '345.0 × 181.0', wheelbaseCm: 345.0, trackWidthCm: 181.0 },
  { name: 'Jumper / Ducato L1', sub: '300.0 × 181.0', wheelbaseCm: 300.0, trackWidthCm: 181.0 },
  { name: 'Sprinter / Crafter medium', sub: '366.5 × 173.0', wheelbaseCm: 366.5, trackWidthCm: 173.0 },
  { name: 'Sprinter / Crafter long', sub: '432.5 × 173.0', wheelbaseCm: 432.5, trackWidthCm: 173.0 },
  { name: 'Transporter T5 / T6', sub: '300.0 × 162.8', wheelbaseCm: 300.0, trackWidthCm: 162.8 },
];

const TOLERANCE_PRESETS = [
  { label: 'Strict', value: 0.2 },
  { label: 'Standard', value: 0.4 },
  { label: 'Comfort', value: 0.6 },
  { label: 'Relaxed', value: 1.0 },
];

const fieldStyle: React.CSSProperties = {
  background: 'var(--well)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
};

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgb(0 0 0 / 0.72)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl flex flex-col gap-5 p-5 sm:p-6 max-h-[92dvh] overflow-y-auto overscroll-contain"
        style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="stencil text-[13px] leading-none" style={{ color: 'var(--ink)' }}>
              Vehicle setup
            </h2>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
              Axle geometry drives the ramp heights; tolerance decides when you count as level.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 shrink-0"
            style={{ color: 'var(--ink-3)', border: '1px solid var(--line)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="seam h-px" />

        {/* Tolerance */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="tolerance-range" className="stencil text-[11px]" style={{ color: 'var(--ink-2)' }}>
              Level tolerance
            </label>
            <span className="readout text-2xl font-semibold" style={{ color: 'var(--amber)' }}>
              ±{tolerance.toFixed(1)}°
            </span>
          </div>

          <input
            id="tolerance-range"
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={tolerance}
            onChange={(e) => setTolerance(parseFloat(e.target.value))}
            className="w-full h-1.5 cursor-pointer appearance-none"
            style={{ accentColor: 'var(--amber)', background: 'var(--well)' }}
          />

          <div className="grid grid-cols-4 gap-2">
            {TOLERANCE_PRESETS.map((tp) => {
              const selected = Math.abs(tolerance - tp.value) < 0.04;
              return (
                <button
                  key={tp.label}
                  type="button"
                  onClick={() => setTolerance(tp.value)}
                  className="px-2 py-2 flex flex-col items-center gap-0.5 transition-colors"
                  style={{
                    border: '1px solid',
                    borderColor: selected ? 'var(--amber)' : 'var(--line)',
                    background: selected
                      ? 'color-mix(in srgb, var(--amber) 12%, transparent)'
                      : 'transparent',
                    color: selected ? 'var(--amber)' : 'var(--ink-2)',
                  }}
                >
                  <span className="stencil text-[9px]">{tp.label}</span>
                  <span className="readout text-sm font-medium">±{tp.value.toFixed(1)}°</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="seam h-px" />

        {/* Dimensions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="wheelbase" className="stencil text-[10px]" style={{ color: 'var(--ink-2)' }}>
              Wheelbase
            </label>
            <div className="relative">
              <input
                id="wheelbase"
                type="number"
                step="0.5"
                min="100"
                max="800"
                value={wheelbase}
                onChange={(e) => setWheelbase(e.target.value)}
                className="readout w-full px-3 py-2.5 pr-10 text-xl font-medium outline-none"
                style={fieldStyle}
              />
              <span
                className="stencil absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                style={{ color: 'var(--ink-3)' }}
              >
                cm
              </span>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Front axle to rear axle
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-width" className="stencil text-[10px]" style={{ color: 'var(--ink-2)' }}>
              Track width
            </label>
            <div className="relative">
              <input
                id="track-width"
                type="number"
                step="0.5"
                min="80"
                max="300"
                value={trackWidth}
                onChange={(e) => setTrackWidth(e.target.value)}
                className="readout w-full px-3 py-2.5 pr-10 text-xl font-medium outline-none"
                style={fieldStyle}
              />
              <span
                className="stencil absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                style={{ color: 'var(--ink-3)' }}
              >
                cm
              </span>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Left wheel to right wheel
            </span>
          </div>
        </section>

        {/* Presets */}
        <section className="flex flex-col gap-2">
          <span className="stencil text-[10px]" style={{ color: 'var(--ink-3)' }}>
            Common vans
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const selected =
                parseFloat(wheelbase) === p.wheelbaseCm && parseFloat(trackWidth) === p.trackWidthCm;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setWheelbase(p.wheelbaseCm.toString());
                    setTrackWidth(p.trackWidthCm.toString());
                  }}
                  className="px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors"
                  style={{
                    border: '1px solid',
                    borderColor: selected ? 'var(--amber)' : 'var(--line)',
                    background: selected
                      ? 'color-mix(in srgb, var(--amber) 10%, transparent)'
                      : 'transparent',
                  }}
                >
                  <span
                    className="text-xs truncate"
                    style={{ color: selected ? 'var(--amber)' : 'var(--ink-2)' }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="readout text-xs shrink-0"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    {p.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Pinned so Save stays reachable on a short head-unit panel without scrolling */}
        <div
          className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 flex items-center justify-end gap-2"
          style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="stencil h-10 px-4 text-[11px]"
            style={{ border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="stencil h-10 px-5 text-[11px] flex items-center gap-2"
            style={{ background: 'var(--amber)', color: 'var(--ground)' }}
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
