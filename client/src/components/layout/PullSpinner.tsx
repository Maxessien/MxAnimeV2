import React from 'react';

export function DynamicPullSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-4 w-full select-none pointer-events-none">
      <div className="relative flex items-center justify-center h-10 w-10">
        {/* The Spinner SVG */}
        <svg
          className="w-8 h-8 text-blue-500 transition-transform duration-75 ease-out"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          // This custom inline animation spins ONLY when the element's parent container is moving/animating downwards.
          // By default, it stays anchored to the drag resistance.
          style={{
            animation: 'spin 1.5s linear infinite',
            animationPlayState: 'paused', // Pauses spinning by default
          }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
          />
          <path
            className="opacity-75"
            style={{ strokeDasharray: '40, 200' }}
            d="M12 2a10 10 0 0 1 10 10"
          />
        </svg>
      </div>
      <span className="text-xs font-medium text-gray-400 mt-1 tracking-wide">
        Pull down
      </span>
    </div>
  );
}
