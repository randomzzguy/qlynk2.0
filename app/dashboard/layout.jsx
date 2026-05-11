'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentProfile, signOut, getCurrentUser, createClientBrowser } from '@/lib/supabase';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop
  const [profile, setProfile] = useState(null);

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

        // Fetch subscription
        const supabase = createClientBrowser();
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .maybeSingle();

        setProfile({ ...userProfile, tier: sub?.tier || 'Trial' });
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

  // Sync collapse state with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const handleCollapseToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', newState.toString());
  };

  // Close sidebar when pathname changes (Mobile)
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <QlynkBackground />
        <div 
          className="absolute rounded-full opacity-10 blur-[120px] animate-pulse"
          style={{
            top: '5%',
            right: '5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, #f46530, transparent 70%)',
          }}
        />
        <div 
          className="absolute rounded-full opacity-10 blur-[120px] animate-pulse delay-700"
          style={{
            bottom: '10%',
            left: '5%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          }}
        />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link href="/" className="group py-2">
          <Image 
            src="/logoWhite.svg" 
            alt="qlynk logo" 
            width={100} 
            height={30} 
            priority
            className="group-hover:scale-105 transition-transform h-auto"
          />
        </Link>
        
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </header>
      
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar 
          onSignOut={handleSignOut} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          onCollapseToggle={handleCollapseToggle}
          username={profile?.username}
          tier={profile?.tier}
        />
        
        {/* Main Content Scrollable Area */}
        <main className={`
          flex-1 overflow-y-auto relative z-10 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
          <div className="min-h-full pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

