'use client';

export default function Speedometer({ currentSpeed = 0, maxLimit = 160 }) {
  const percentage = Math.min(100, Math.max(0, (currentSpeed / maxLimit) * 100));
  const angle = (percentage / 100) * 180 - 90; // -90 to +90 degrees

  return (
    <div className="relative flex flex-col items-center justify-center p-4 border border-ocean-border bg-ocean-surface font-mono">
      <div className="text-ocean-soft text-xs font-bold uppercase tracking-wider mb-2">DYNAMIC SPEEDOMETER</div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#383C4D"
            strokeWidth="8"
          />
          {/* Active Speed Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#A2758E"
            strokeWidth="8"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (125.6 * percentage) / 100}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Needle Indicator */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-ocean-peach transform -translate-x-1/2 origin-bottom transition-transform duration-500 ease-out shadow-[0_0_10px_#FCDCCF]"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-ocean-mauve border border-ocean-bg transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Speed Numerical Display */}
      <div className="mt-4 text-center">
        <div className="text-3xl font-extrabold text-ocean-light tracking-widest">{currentSpeed} <span className="text-sm text-ocean-peach">KM/H</span></div>
        <div className="text-[10px] text-ocean-soft mt-1">SPEED LIMIT: <span className="text-ocean-light font-bold">{maxLimit} KM/H</span></div>
      </div>
    </div>
  );
}
