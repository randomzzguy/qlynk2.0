'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[App Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[#f46530]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#f46530]/20">
          <AlertTriangle className="text-[#f46530]" size={40} />
        </div>

        <h1 className="text-3xl font-black text-white mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          An unexpected error occurred. Try refreshing the page, or return home and try again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#f46530] text-white rounded-2xl font-bold hover:bg-[#c14f22] transition-all shadow-xl shadow-[#f46530]/20"
          >
            <RotateCcw size={18} />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
          >
            <Home size={18} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
