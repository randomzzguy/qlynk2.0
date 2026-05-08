'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentProfile, signOut, getCurrentUser } from '@/lib/supabase';
import DashboardSidebar from '@/components/DashboardSidebar';
import QlynkBackground from '@/components/QlynkBackground';
import { Menu, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Close sidebar when pathname changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f0f14]">
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

      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-[#12121a]/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 flex-shrink-0">
            <Image 
              src="/assets/iconWhite.svg" 
              alt="qlynk icon" 
              width={32} 
              height={32} 
              priority
            />
          </div>
          <span className="text-xl font-black text-white leading-none">qlynk</span>
        </Link>
        
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </header>
      
      <DashboardSidebar 
        onSignOut={handleSignOut} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 overflow-y-auto relative z-10 w-full">
        {children}
      </main>
    </div>
  );
}
