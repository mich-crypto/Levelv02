import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompassSunriseBadgeProps {
  yaw?: number; // device heading in degrees (0-360)
}

export const CompassSunriseBadge: React.FC<CompassSunriseBadgeProps> = ({ yaw }) => {
  const [sunriseAzimuth, setSunriseAzimuth] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Sunrise bearing needs a latitude fix. If we never get one we leave it
  // null rather than showing a due-east guess dressed up as a real reading.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff =
          now.getTime() -
          start.getTime() +
          (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        const declination =
          23.45 * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear)) * (Math.PI / 180);
        const latRad = lat * (Math.PI / 180);

        const cosAz = Math.max(-1, Math.min(1, Math.sin(declination) / Math.cos(latRad)));
        const azDeg = 360 - (Math.acos(cosAz) * 180) / Math.PI;
        setSunriseAzimuth(Math.round(azDeg));
      },
      () => setSunriseAzimuth(null),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // No absolute (north-referenced) source on this device -> no heading.
  const hasHeading = typeof yaw === 'number' && !Number.isNaN(yaw);
  const heading = hasHeading ? Math.round(yaw as number) : 0;

  const dial = (size: number, showCardinals: boolean) => (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <g style={{ transform: `rotate(${-heading}deg)`, transformOrigin: '60px 60px' }}>
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="1" />
        {Array.from({ length: 24 }, (_, i) => i * 15).map((deg) => {
          const heavy = deg % 90 === 0;
          const rad = ((deg - 90) * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={60 + Math.cos(rad) * (heavy ? 43 : 47)}
              y1={60 + Math.sin(rad) * (heavy ? 43 : 47)}
              x2={60 + Math.cos(rad) * 52}
              y2={60 + Math.sin(rad) * 52}
              stroke={heavy ? 'var(--line-strong)' : 'var(--line)'}
              strokeWidth={heavy ? 1.5 : 1}
            />
          );
        })}
        <text x="60" y="28" textAnchor="middle" fontSize="13" className="stencil" fill="var(--amber)">
          N
        </text>
        {showCardinals && (
          <>
            <text x="98" y="65" textAnchor="middle" fontSize="11" className="stencil" fill="var(--ink-3)">
              E
            </text>
            <text x="60" y="102" textAnchor="middle" fontSize="11" className="stencil" fill="var(--ink-3)">
              S
            </text>
            <text x="22" y="65" textAnchor="middle" fontSize="11" className="stencil" fill="var(--ink-3)">
              W
            </text>
          </>
        )}
        {sunriseAzimuth !== null && (
          <circle
            cx={60 + Math.cos(((sunriseAzimuth - 90) * Math.PI) / 180) * 52}
            cy={60 + Math.sin(((sunriseAzimuth - 90) * Math.PI) / 180) * 52}
            r="4"
            fill="var(--amber)"
          />
        )}
      </g>

      {/* Vehicle nose — fixed, always pointing up */}
      <path d="M60 34 L68 74 L60 67 L52 74 Z" fill="var(--ink-2)" />
    </svg>
  );

  return (
    <>
      <button
        onClick={() => setIsExpanded(true)}
        title="Heading and sunrise bearing"
        className="h-10 px-2.5 flex items-center gap-2.5 transition-colors"
        style={{ border: '1px solid var(--line)', color: 'var(--ink-2)' }}
      >
        <span className="stencil text-[10px]" style={{ color: 'var(--ink-3)' }}>
          Heading
        </span>
        <span className="readout text-base font-medium">
          {hasHeading ? `${heading}°` : '—'}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgb(0 0 0 / 0.72)' }}
            onClick={() => setIsExpanded(false)}
          >
            <div
              className="relative w-full max-w-xs p-6 flex flex-col items-center gap-5"
              style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsExpanded(false)}
                aria-label="Close"
                className="absolute top-3 right-3 p-2"
                style={{ color: 'var(--ink-3)' }}
              >
                <X className="w-4 h-4" />
              </button>

              <span className="stencil text-[11px] self-start" style={{ color: 'var(--ink-2)' }}>
                Heading
              </span>

              {dial(200, true)}

              <div className="w-full grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1 py-2" style={{ border: '1px solid var(--line)' }}>
                  <span className="stencil text-[9px]" style={{ color: 'var(--ink-3)' }}>
                    Nose
                  </span>
                  <span
                    className="readout text-2xl font-semibold"
                    style={{ color: hasHeading ? 'var(--ink)' : 'var(--ink-3)' }}
                  >
                    {hasHeading ? `${heading}°` : '—'}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 py-2" style={{ border: '1px solid var(--line)' }}>
                  <span className="stencil text-[9px]" style={{ color: 'var(--ink-3)' }}>
                    Sunrise
                  </span>
                  <span
                    className="readout text-2xl font-semibold"
                    style={{ color: sunriseAzimuth !== null ? 'var(--amber)' : 'var(--ink-3)' }}
                  >
                    {sunriseAzimuth !== null ? `${sunriseAzimuth}°` : '—'}
                  </span>
                </div>
              </div>

              {!hasHeading && (
                <p className="text-[11px] text-center" style={{ color: 'var(--ink-3)' }}>
                  This device reports no compass bearing, only tilt. Heading needs a
                  magnetometer reading referenced to north, which it is not providing.
                </p>
              )}

              {hasHeading && sunriseAzimuth === null && (
                <p className="text-[11px] text-center" style={{ color: 'var(--ink-3)' }}>
                  Sunrise bearing needs a location fix, which this device has not provided.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
