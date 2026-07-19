'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QlynkBackground from '@/components/QlynkBackground';
import { createClient } from '@/utils/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyRecoverySession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) setError('This reset link is invalid or has expired. Request a new one.');
      setChecking(false);
    };
    verifyRecoverySession();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Unable to update your password.');
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push('/auth/login?password_updated=1');
    router.refresh();
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
            <KeyRound className="text-orange" size={23} />
          </div>
          <div className="text-center mb-7">
            <h1 className="text-3xl font-black text-cream mb-2">Choose a New Password</h1>
            <p className="text-beige text-sm">Use at least eight characters and avoid reusing an old password.</p>
          </div>

          {error && <div className="mb-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

          {checking ? (
            <div className="flex items-center justify-center py-10"><div className="w-7 h-7 border-3 border-orange border-t-transparent rounded-full animate-spin" /></div>
          ) : error.includes('invalid or has expired') ? (
            <Link href="/auth/forgot-password" className="w-full py-3 rounded-xl font-bold semi-translucent-button text-cream flex items-center justify-center">Request a New Link</Link>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block font-bold text-cream mb-2">New password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} minLength={8} maxLength={128} autoComplete="new-password" required className="w-full px-4 py-3 pr-12 text-neutral-900 border-2 border-gray-200 rounded-xl focus:border-bright-orange focus:outline-none" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-panel-grey hover:text-charcoal">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block font-bold text-cream mb-2">Confirm password</label>
                <input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} minLength={8} maxLength={128} autoComplete="new-password" required className="w-full px-4 py-3 text-neutral-900 border-2 border-gray-200 rounded-xl focus:border-bright-orange focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg semi-translucent-button text-cream hover:shadow-xl hover:shadow-orange/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={20} />}
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
