'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Check onboarding status
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();

          if (!profile?.onboarding_completed) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, [router]);

  const [hcaptchaToken, setHcaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  const onHCaptchaChange = (token) => {
    setHcaptchaToken(token);
    if (token) {
      setError('');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const captchaRequired = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !isLocalhost;

    if (captchaRequired && !hcaptchaToken) {
      setError('Please verify you are human.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      // Check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-black text-cream mb-2">Welcome Back</h1>
            <p className="text-beige">Log in to manage your q-agent</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block font-bold text-cream mb-2">
                Email
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block font-bold text-cream">
                  Password
                </label>
                <Link href="#" className="text-sm text-orange hover:underline font-semibold">
                  Forgot?
                </Link>
              </div>
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

            {/* hCaptcha */}
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
                  Logging In...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Log In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-beige">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-bold text-orange hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
