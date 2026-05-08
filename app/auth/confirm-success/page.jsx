'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, ArrowRight, LogIn } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';

export default function ConfirmSuccessPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-6">
      <QlynkBackground />

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <Image
            src="/logoWhite.svg"
            alt="qlynk logo"
            width={125}
            height={50}
            priority
            className="group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Card */}
        <div className="semi-translucent-card rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </div>

          <h1 className="text-3xl font-black text-cream mb-4">Email Verified!</h1>
          <p className="text-beige mb-8">
            Your account has been successfully verified. You can now log in to access your q-agent dashboard.
          </p>

          <Link 
            href="/auth/login"
            className="w-full py-4 rounded-xl font-bold text-lg semi-translucent-button text-cream flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-orange/40 transition-all"
          >
            <LogIn size={20} />
            Log In Now
          </Link>
        </div>

        {/* Back to Home */}
        <p className="text-center text-beige mt-8">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-cream transition-colors">
            Back to home <ArrowRight size={16} />
          </Link>
        </p>
      </div>
    </div>
  );
}
