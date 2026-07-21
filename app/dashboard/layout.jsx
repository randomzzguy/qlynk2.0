'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getCurrentProfile, signOut, getCurrentUser, createClientBrowser } from '@/lib/supabase';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardWalkthrough from '@/components/DashboardWalkthrough';
import DashboardRouteLoader from '@/components/DashboardRouteLoader';
import QlynkBackground from '@/components/QlynkBackground';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f14] px-6">
        <DashboardRouteLoader label="Preparing your dashboard…" />
      </div>
    )}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const routeKey = searchString ? `${pathname}?${searchString}` : pathname;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop
  const [profile, setProfile] = useState(null);
  const sidebarWasCollapsedBeforeTourRef = useRef(null);
  const previousRouteKeyRef = useRef(routeKey);
  const contentRef = useRef(null);

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

  const prepareDashboardTour = useCallback(() => {
    setIsCollapsed((current) => {
      if (sidebarWasCollapsedBeforeTourRef.current === null) {
        sidebarWasCollapsedBeforeTourRef.current = current;
      }
      return false;
    });
    localStorage.setItem('sidebar-collapsed', 'false');
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  const restoreDashboardTourUi = useCallback(() => {
    if (sidebarWasCollapsedBeforeTourRef.current !== null) {
      const shouldCollapse = sidebarWasCollapsedBeforeTourRef.current;
      sidebarWasCollapsedBeforeTourRef.current = null;
      setIsCollapsed(shouldCollapse);
      localStorage.setItem('sidebar-collapsed', shouldCollapse.toString());
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleDashboardTourStatus = useCallback((status) => {
    setProfile((current) => current ? {
      ...current,
      dashboard_tour_status: status,
      dashboard_tour_version: 1,
      dashboard_tour_completed_at: new Date().toISOString(),
    } : current);
    restoreDashboardTourUi();
  }, [restoreDashboardTourUi]);

  // Close sidebar when pathname changes (Mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) return;

    previousRouteKeyRef.current = routeKey;
    let frame;
    const revealTimer = window.setTimeout(() => {
      frame = window.requestAnimationFrame(() => {
        setRouteLoading(false);

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          contentRef.current?.animate(
            [
              { opacity: 0, transform: 'translateY(14px)', filter: 'blur(3px)' },
              { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
            ],
            { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
          );
        }
      });
    }, 900);

    return () => {
      window.clearTimeout(revealTimer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [routeKey]);

  useEffect(() => {
    if (!routeLoading) return undefined;
    const safetyTimer = window.setTimeout(() => setRouteLoading(false), 8000);
    return () => window.clearTimeout(safetyTimer);
  }, [routeLoading]);

  const handleDashboardNavigate = useCallback((targetHref) => {
    const targetUrl = new URL(targetHref, window.location.origin);
    const targetKey = `${targetUrl.pathname}${targetUrl.search}`;
    if (targetKey !== routeKey) setRouteLoading(true);
  }, [routeKey]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f14]">
        <DashboardRouteLoader label="Preparing your dashboard…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Toaster position="top-right" />
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <QlynkBackground />
        <div 
          className="absolute rounded-full blur-[120px] animate-breathe"
          style={{
            top: '5%',
            right: '5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, #f46530, transparent 70%)',
          }}
        />
        <div 
          className="absolute rounded-full blur-[120px] animate-breathe"
          style={{
            bottom: '10%',
            left: '5%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
            animationDelay: '-4s'
          }}
        />
      </div>

      {/* Mobile Header */}
      <header data-dashboard-tour-background className="lg:hidden h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link href="/" className="group py-2">
          <Image 
            src="/logoWhite.svg" 
            alt="Qlynk AI logo"
            width={100} 
            height={30} 
            priority
            className="group-hover:scale-105 transition-transform"
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
          avatarUrl={profile?.avatar_url}
          tier={profile?.tier}
          accountDeletionScheduledFor={profile?.account_deletion_scheduled_for}
          onNavigate={handleDashboardNavigate}
        />

        <DashboardWalkthrough
          profile={profile}
          onPrepareTour={prepareDashboardTour}
          onStatusChange={handleDashboardTourStatus}
          onExitTour={restoreDashboardTourUi}
        />
        
        {/* Main Content Scrollable Area */}
        <main data-dashboard-tour-background data-dashboard-tour-main tabIndex={-1} className={`
          flex-1 overflow-y-auto relative z-10 transition-all duration-300 ease-in-out motion-reduce:transition-none
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
          <AnimatePresence>
            {routeLoading && (
              <motion.div
                className={`fixed bottom-0 left-0 right-0 top-16 z-30 flex items-center justify-center bg-[#0a0a0f]/85 px-6 backdrop-blur-md lg:top-0 ${isCollapsed ? 'lg:left-20' : 'lg:left-64'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <DashboardRouteLoader />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={contentRef} className="min-h-full pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
