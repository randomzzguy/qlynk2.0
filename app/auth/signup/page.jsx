'use client';

import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { Suspense } from 'react';
import QlynkBackground from '@/components/QlynkBackground';
import HCaptcha from '@hcaptcha/react-hcaptcha';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: searchParams.get('username') || '',
    email: searchParams.get('email') || '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [needsVerification, _setNeedsVerification] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  const onHCaptchaChange = (token) => {
    setHcaptchaToken(token);
    if (token) {
      setError(''); // Clear the error message when the user solves the captcha
    }
  };


  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return false;
    }

    // Username validation
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return false;
    }

    if (!/^[a-z0-9_-]+$/.test(formData.username)) {
      setError('Username can only contain lowercase letters, numbers, hyphens, and underscores');
      return false;
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Only require captcha if the site key is configured AND we're not on localhost
    const captchaRequired = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !isLocalhost;

    if (captchaRequired && !hcaptchaToken) {
      setError('Please verify you are human.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const bypassCaptcha = isLocalhost; // Force bypass on local development

    if (!validateForm() && !bypassCaptcha) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, hcaptchaToken: hcaptchaToken || (bypassCaptcha ? 'local-bypass' : null) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      setError(error.message);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

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
        <div className="semi-translucent-card rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-cream mb-2">Create Your q-agent</h1>
            <p className="text-beige">Your AI ambassador starts here</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {!needsVerification ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block font-bold text-cream mb-2">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your-username"
                  className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-xl focus:border-bright-orange focus:outline-none transition-all"
                  disabled={loading}
                />
                <p className="text-xs text-white mt-1.5 ml-1">
                  Your q-agent will be at: qlynk.site/{formData.username || 'username'}
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block font-bold text-cream mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-xl focus:border-bright-orange focus:outline-none transition-all"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block font-bold text-cream mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-xl focus:border-bright-orange focus:outline-none transition-all pr-12"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-panel-grey hover:text-charcoal transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
                <HCaptcha
                  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
                  onVerify={onHCaptchaChange}
                  ref={captchaRef}
                />
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${loading
                  ? 'semi-translucent-button text-cream opacity-75 cursor-wait'
                  : 'semi-translucent-button text-cream hover:shadow-xl hover:shadow-orange/40'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <h2 className="text-2xl font-black text-cream">Check Your Email</h2>
              <p className="text-beige">We sent a verification link to {formData.email}. Open it to sign in and continue.</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="semi-translucent-button text-cream px-6 py-3 rounded-xl font-bold"
                >
                  Log In
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mt-8 text-center">
            <p className="text-beige">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-sm text-beige mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-cream hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-cream hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
