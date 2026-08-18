import React, { useState, useEffect } from 'react';
import { Sun, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompassSunriseBadgeProps {
  yaw?: number; // Device heading in degrees (0-360)
  isDayMode: boolean;
}

export const CompassSunriseBadge: React.FC<CompassSunriseBadgeProps> = ({
  yaw = 0,
  isDayMode,
}) => {
  const [sunriseAzimuth, setSunriseAzimuth] = useState<number>(90); // default East
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Request GPS location to compute exact sunrise azimuth based on latitude and day of year
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
          
          const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (284 + dayOfYear)) * (Math.PI / 180);
          const latRad = lat * (Math.PI / 180);
          
          let cosAz = Math.sin(declination) / Math.cos(latRad);
          cosAz = Math.max(-1, Math.min(1, cosAz));
          const azRad = Math.acos(cosAz);
          const azDeg = 360 - (azRad * (180 / Math.PI));
          setSunriseAzimuth(Math.round(azDeg));
        },
        () => {
          setSunriseAzimuth(90);
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  const heading = yaw ?? 0;

  return (
    <>
      {/* Compact Bottom-Right Button (Longer box, smaller arrow, sun further outside) */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`px-6 py-2.5 rounded-2xl border flex items-center justify-between gap-4 shadow-sm transition-transform active:scale-95 cursor-pointer min-w-[100px] ${
          isDayMode
            ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800'
        }`}
        title="Open Fullscreen Compass & Sunrise"
      >
        <div className="relative flex items-center justify-center w-12 h-12">
          {/* Rotating compass ring container */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
            {/* Inner Circle Dial */}
            <div className="w-9 h-9 rounded-full bg-neutral-800/10 dark:bg-neutral-800 border border-neutral-600/30 overflow-hidden relative flex items-center justify-center">
              <span className="absolute top-0.5 text-[8px] font-bold text-red-500 leading-none">N</span>
            </div>

            {/* Sun placed further outside the circle perimeter */}
            <div
              className="absolute w-4 h-4 flex items-center justify-center pointer-events-none"
              style={{
                transform: `rotate(${sunriseAzimuth}deg) translateY(-26px) rotate(-${sunriseAzimuth}deg)`,
              }}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400 drop-shadow" />
            </div>
          </div>

          {/* Static Upright Vehicle Arrow (Smaller size) */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 fill-emerald-400">
              <path d="M12 2L19 21L12 17L5 21L12 2Z" />
            </svg>
          </div>
        </div>

        <Maximize2 className="w-3.5 h-3.5 opacity-40 ml-1" />
      </button>

      {/* Expanded Fullscreen / Center Overlay Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          >
            <div
              className={`relative w-full max-w-sm p-6 rounded-3xl border shadow-2xl flex flex-col items-center text-center ${
                isDayMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-neutral-900 border-neutral-800 text-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800/10 dark:bg-neutral-800 hover:opacity-80 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold mb-6">Heading</h3>

              {/* Large Compass Dial with Sun positioned outside the circle */}
              <div className="relative flex items-center justify-center w-56 h-56 mb-6">
                
                {/* Rotating Compass Ring Container */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `rotate(${-heading}deg)` }}
                >
                  {/* Inner Dial Circle */}
                  <div className="absolute w-40 h-40 rounded-full bg-neutral-800/10 dark:bg-neutral-800 border-2 border-neutral-600/40 shadow-inner overflow-hidden flex items-center justify-center">
                    {/* Cardinal Points */}
                    <span className="absolute top-2 text-sm font-bold text-red-500">N</span>
                    <span className="absolute right-3 text-xs font-bold opacity-70">E</span>
                    <span className="absolute bottom-2 text-xs font-bold opacity-70">S</span>
                    <span className="absolute left-3 text-xs font-bold opacity-70">W</span>
                  </div>

                  {/* Sun placed further outside the circle perimeter in expanded mode */}
                  <div
                    className="absolute w-6 h-6 flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `rotate(${sunriseAzimuth}deg) translateY(-102px) rotate(-${sunriseAzimuth}deg)`,
                    }}
                  >
                    <Sun className="w-6 h-6 text-amber-400 animate-pulse drop-shadow-md" />
                  </div>
                </div>

                {/* Static Center Vehicle Direction Arrow (Always pointing straight UP, non-rotating) */}
                <div className="absolute z-20 flex flex-col items-center pointer-events-none">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 fill-emerald-400 drop-shadow">
                    <path d="M12 2L19 21L12 17L5 21L12 2Z" />
                  </svg>
                </div>
              </div>

              {/* Legend / Info */}
              <div className="w-full grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-neutral-800/10 dark:bg-neutral-800/50 border border-neutral-700/30 flex flex-col items-center">
                  <span className="opacity-60 text-[10px]">HEADING</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5">{Math.round(heading)}°</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/10 dark:bg-neutral-800/50 border border-neutral-700/30 flex flex-col items-center">
                  <span className="opacity-60 text-[10px]">SUNRISE</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5">{sunriseAzimuth}°</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
