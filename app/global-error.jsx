'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[Global Error Boundary]:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-white min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#f46530]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#f46530]/20">
            <AlertTriangle className="text-[#f46530]" size={40} />
          </div>

          <h1 className="text-3xl font-black text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Qlynk could not load this page. Try again, and contact support if the problem continues.
          </p>

          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#f46530] text-white rounded-2xl font-bold hover:bg-[#c14f22] transition-all shadow-xl shadow-[#f46530]/20"
          >
            <RotateCcw size={18} />
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
