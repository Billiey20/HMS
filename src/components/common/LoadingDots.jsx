import React from 'react';

/**
 * A minimalist "three bouncing dots" loader for use inside buttons or small containers.
 * @param {string} color - Tailwind class for the dot color (default: currentColor)
 * @param {string} size - Size of the dots (default: w-1.5 h-1.5)
 */
export default function LoadingDots({ color = 'currentColor', size = 'w-1.5 h-1.5' }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size} rounded-full animate-bounce`}
          style={{
            backgroundColor: color === 'currentColor' ? 'white' : undefined,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}} />
    </div>
  );
}
