'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import QlynkBackground from '@/components/QlynkBackground';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const captchaRequired = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !isLocalhost;

    if (captchaRequired && !hcaptchaToken) {
      setError('Please verify you are human.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          hcaptchaToken: hcaptchaToken || (isLocalhost ? 'local-bypass' : null),
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Unable to request a reset link.');
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
      captchaRef.current?.resetCaptcha();
      setHcaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-6">
      <QlynkBackground />
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <Image src="/logoWhite.svg" alt="Qlynk AI logo" width={135} height={50} priority className="group-hover:scale-105 transition-transform" />
        </Link>

        <div className="semi-translucent-card rounded-2xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-orange/15 border border-orange/25 flex items-center justify-center mx-auto mb-5">
            <Mail className="text-orange" size={23} />
          </div>
          <div className="text-center mb-7">
            <h1 className="text-3xl font-black text-cream mb-2">Reset Your Password</h1>
            <p className="text-beige text-sm leading-relaxed">Enter your account email and we&apos;ll send a secure link to choose a new password.</p>
          </div>

          {error && <div className="mb-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
          {message && <div className="mb-5 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-800 text-sm">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block font-bold text-cream mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(''); }}
                placeholder="your@email.com"
                autoComplete="email"
                required
                disabled={loading || Boolean(message)}
                className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-xl focus:border-bright-orange focus:outline-none transition-all disabled:opacity-70"
              />
            </div>

            {process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !message && (
              <HCaptcha sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY} onVerify={(token) => setHcaptchaToken(token)} ref={captchaRef} />
            )}

            {!message && (
              <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg semi-translucent-button text-cream hover:shadow-xl hover:shadow-orange/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={19} />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            )}
          </form>

          <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-orange hover:underline">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
