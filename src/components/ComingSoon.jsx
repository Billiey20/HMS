import React from 'react';

export default function ComingSoon({ title, icon }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl mb-4">
        {icon}
      </div>
      <h1 className="text-2xl font-black text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500 text-sm max-w-sm">
        This module is under development and will be available in a future phase. Core infrastructure is being built now.
      </p>
      <span className="mt-4 badge badge-amber">Coming in Phase 2</span>
    </div>
  );
}
