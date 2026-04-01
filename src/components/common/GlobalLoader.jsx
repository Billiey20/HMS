import React from 'react';
import { useLoading } from '../../context/LoadingContext';
import { LocalHospital } from '@mui/icons-material';

export default function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center gap-6">
        {/* Outer Pulsing Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-primary-500/20 rounded-full animate-ping" />
          <div className="absolute w-32 h-32 bg-primary-500/10 rounded-full animate-pulse delay-700" />
        </div>

        {/* Core Animated Icon */}
        <div className="relative w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-white/50 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 via-primary-500 to-primary-400 opacity-90 animate-shimmer" />
          <LocalHospital className="text-white relative z-10 animate-bounce" sx={{ fontSize: 40 }} />
          
          {/* Internal Loading Strip */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
             <div className="h-full bg-white animate-progress-indefinite" />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1.5 drop-shadow-lg">
          <p className="text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">
            Processing Request
          </p>
          <div className="flex gap-1">
             {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
             ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-indefinite {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 50%; }
          100% { transform: translateX(333%); width: 20%; }
        }
        .animate-progress-indefinite {
          animation: progress-indefinite 1.5s infinite linear;
        }
        @keyframes shimmer {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-shimmer {
          animation: shimmer 10s infinite linear;
        }
      `}} />
    </div>
  );
}
