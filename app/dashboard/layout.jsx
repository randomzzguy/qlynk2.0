'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentProfile, signOut, getCurrentUser } from '@/lib/supabase';
import DashboardSidebar from '@/components/DashboardSidebar';
import QlynkBackground from '@/components/QlynkBackground';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const userProfile = await getCurrentProfile();
        if (!userProfile || !userProfile.onboarding_completed) {
          router.push('/onboarding');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f46530] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#0f0f14]">
      {/* Background - neon lines, particles and gradient orbs matching homepage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <QlynkBackground />
        <div 
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            top: '10%',
            right: '10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, #f46530, transparent 70%)',
          }}
        />
        <div 
          className="absolute rounded-full opacity-15 blur-3xl"
          style={{
            bottom: '20%',
            left: '5%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, #2AB59E, transparent 70%)',
          }}
        />
      </div>
      
      <DashboardSidebar onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
