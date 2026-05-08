'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowRight, LogIn } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import QlynkBackground from '@/components/QlynkBackground';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

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
          <div className="w-20 h-20 bg-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="text-orange w-10 h-10" />
          </div>

          <h1 className="text-3xl font-black text-cream mb-4">Check Your Email</h1>
          <p className="text-beige mb-8">
            We've sent a verification link to <span className="text-cream font-bold">{email || 'your email'}</span>. 
            Please click the link in the email to verify your account.
          </p>

          <div className="space-y-4">
            <Link 
              href="/auth/login"
              className="w-full py-4 rounded-xl font-bold text-lg semi-translucent-button text-cream flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-orange/40 transition-all"
            >
              <LogIn size={20} />
              Go to Login
            </Link>
            
            <p className="text-sm text-beige">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
          </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
