'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, Bot } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0a0f]">
      <QlynkBackground />
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#f46530]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <Link href="/" className="inline-block mb-12">
            <Image 
              src="/logoWhite.svg" 
              alt="qlynk logo" 
              width={140} 
              height={50} 
              priority 
            />
          </Link>

          {/* 404 Visual */}
          <div className="relative inline-block mb-8">
            <div className="text-[120px] sm:text-[180px] font-black leading-none text-white/5 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
               <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#f46530] to-[#ff8c5a] rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(244,101,48,0.3)] border border-white/20"
               >
                 <Bot size={60} className="text-white" />
               </motion.div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Oops! This page is <span className="text-[#f46530]">missing</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Maybe your AI clone knows where it went?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#f46530] text-white rounded-2xl font-bold hover:bg-[#c14f22] transition-all shadow-xl shadow-[#f46530]/20"
            >
              <Home size={20} />
              Return Home
            </Link>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              <Search size={20} />
              Claim Your Handle
            </Link>
          </div>

          {/* Useful links */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500">
             <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
             <Link href="/faq" className="hover:text-white transition-colors">Help Center</Link>
             <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
