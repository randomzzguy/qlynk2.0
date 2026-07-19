'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Compass,
  Eye,
  Palette,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

export const DASHBOARD_TOUR_VERSION = 1;

const TOUR_STEPS = [
  {
    target: 'overview',
    eyebrow: 'Your command center',
    title: 'Start with the big picture',
    description: 'Overview shows how ready your agent is, what still needs attention, and the latest activity in one place.',
    icon: BarChart3,
  },
  {
    target: 'agent-setup',
    eyebrow: 'Define the job',
    title: 'Shape how your agent responds',
    description: 'Set its purpose, audience, allowed topics, safety boundaries, welcome message, and publishing status here.',
    icon: SlidersHorizontal,
  },
  {
    target: 'knowledge',
    eyebrow: 'Give it the right answers',
    title: 'Build the approved knowledge base',
    description: 'Add facts, FAQs, links, documents, and profile context. Your agent uses this information instead of making things up.',
    icon: Brain,
  },
  {
    target: 'visual-style',
    eyebrow: 'Make it feel like yours',
    title: 'Match the customer experience to your brand',
    description: 'Adjust colors, typography, chat styling, and presentation without changing the agent’s rules or knowledge.',
    icon: Palette,
  },
  {
    target: 'view-agent',
    eyebrow: 'See what customers see',
    title: 'Preview before you share',
    description: 'Open your public agent and test the full experience. Once visitors start chatting, Conversations and Analytics will show what they need next.',
    icon: Eye,
  },
];

export default function DashboardWalkthrough({ profile, onPrepareTour, onStatusChange }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const openedForProfileRef = useRef(null);
  const sidebarScrollStartRef = useRef(null);
  const dialogRef = useRef(null);
  const primaryButtonRef = useRef(null);

  const requestedFromSettings = searchParams.get('tour') === '1';
  const isPending = profile?.dashboard_tour_status === 'pending'
    && Number(profile?.dashboard_tour_version || DASHBOARD_TOUR_VERSION) <= DASHBOARD_TOUR_VERSION;

  useEffect(() => {
    if (!profile?.id) return;
    if (pathname !== '/dashboard' || (!requestedFromSettings && !isPending)) {
      openedForProfileRef.current = null;
      return;
    }
    if (openedForProfileRef.current === profile.id) return;

    const openTimer = window.setTimeout(() => {
      openedForProfileRef.current = profile.id;
      setStepIndex(0);
      setPhase('intro');
    }, 0);
    return () => window.clearTimeout(openTimer);
  }, [isPending, pathname, profile?.id, requestedFromSettings]);

  useEffect(() => {
    if (!phase) return;
    const timer = window.setTimeout(() => primaryButtonRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [phase, stepIndex]);

  useEffect(() => {
    if (!phase) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialogRef.current?.querySelector('[data-skip-tour]')?.click();
        return;
      }

      if (phase === 'steps' && event.key === 'ArrowRight') {
        event.preventDefault();
        primaryButtonRef.current?.click();
      }

      if (phase === 'steps' && event.key === 'ArrowLeft' && stepIndex > 0) {
        event.preventDefault();
        setStepIndex((current) => current - 1);
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, stepIndex]);

  useEffect(() => {
    if (phase !== 'steps') return;

    onPrepareTour?.();
    let cancelled = false;
    let target = null;

    const measureTarget = () => {
      if (cancelled) return;
      target = document.querySelector(`[data-tour="${TOUR_STEPS[stepIndex].target}"]`);
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 7;
      setTargetRect({
        left: Math.max(6, rect.left - padding),
        top: Math.max(6, rect.top - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    };

    const settleTimer = window.setTimeout(() => {
      target = document.querySelector(`[data-tour="${TOUR_STEPS[stepIndex].target}"]`);
      target?.scrollIntoView({
        behavior: 'smooth',
        block: window.innerWidth < 768 ? 'start' : 'center',
      });
      measureTarget();
    }, 320);
    const secondMeasureTimer = window.setTimeout(measureTarget, 650);
    const initialMeasureFrame = window.requestAnimationFrame(measureTarget);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      cancelled = true;
      window.clearTimeout(settleTimer);
      window.clearTimeout(secondMeasureTimer);
      window.cancelAnimationFrame(initialMeasureFrame);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [onPrepareTour, phase, stepIndex]);

  const saveStatus = async (status) => {
    setPhase(null);
    setTargetRect(null);
    onStatusChange?.(status);

    const sidebarScroller = document.querySelector('[data-tour-sidebar-scroll]');
    if (sidebarScroller && sidebarScrollStartRef.current !== null) {
      sidebarScroller.scrollTo({ top: sidebarScrollStartRef.current, behavior: 'smooth' });
    }
    sidebarScrollStartRef.current = null;

    if (requestedFromSettings) {
      router.replace('/dashboard', { scroll: false });
    }

    if (!profile?.id) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        dashboard_tour_status: status,
        dashboard_tour_version: DASHBOARD_TOUR_VERSION,
        dashboard_tour_completed_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Unable to save dashboard walkthrough status:', error);
      toast.error('Your tour preference could not be saved.');
    }
  };

  const startTour = () => {
    sidebarScrollStartRef.current = document.querySelector('[data-tour-sidebar-scroll]')?.scrollTop || 0;
    onPrepareTour?.();
    setStepIndex(0);
    setPhase('steps');
  };

  const nextStep = () => {
    if (stepIndex === TOUR_STEPS.length - 1) {
      saveStatus('completed');
      return;
    }
    setStepIndex((current) => current + 1);
  };

  if (!phase) return null;

  const step = TOUR_STEPS[stepIndex];
  const StepIcon = step?.icon || Compass;
  const isMobile = viewport.width > 0 && viewport.width < 768;
  const mobileTargetIsLow = isMobile && targetRect && targetRect.top > viewport.height * 0.48;
  const tooltipWidth = Math.min(370, Math.max(280, viewport.width - 32));
  const tooltipLeft = targetRect && !isMobile
    ? Math.min(targetRect.left + targetRect.width + 18, viewport.width - tooltipWidth - 18)
    : 16;
  const tooltipTop = mobileTargetIsLow
    ? 72
    : targetRect && !isMobile
      ? Math.max(18, Math.min(targetRect.top - 8, viewport.height - 330))
      : undefined;

  return (
    <AnimatePresence>
      {phase === 'intro' && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-tour-title"
            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#101016] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-9"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#f46530]/20 blur-[80px]" />
            <button
              type="button"
              data-skip-tour
              onClick={() => saveStatus('skipped')}
              className="absolute right-5 top-5 rounded-xl p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Skip dashboard walkthrough"
            >
              <X size={20} />
            </button>

            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f46530]/25 bg-[#f46530]/10 text-[#f46530] shadow-lg shadow-[#f46530]/10">
                <Compass size={32} />
              </div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#f46530]">Your Qlynk workspace</p>
              <h2 id="dashboard-tour-title" className="mb-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Ready for a quick look around?
              </h2>
              <p className="max-w-md text-sm leading-6 text-gray-400 sm:text-base">
                In about a minute, we’ll show you where to shape your agent, give it trusted knowledge, match your brand, and preview what customers will see.
              </p>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  data-skip-tour
                  onClick={() => saveStatus('skipped')}
                  className="rounded-2xl px-5 py-3 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Skip for now
                </button>
                <button
                  ref={primaryButtonRef}
                  type="button"
                  onClick={startTour}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f46530] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#f46530]/25 transition-all hover:-translate-y-0.5 hover:bg-[#f57a4f]"
                >
                  Show me around
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {phase === 'steps' && (
        <div className="fixed inset-0 z-[120]" aria-live="polite">
          <svg
            className="fixed inset-0 h-full w-full"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <defs>
              <mask id="qlynk-tour-spotlight" maskUnits="userSpaceOnUse">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left}
                    y={targetRect.top}
                    width={targetRect.width}
                    height={targetRect.height}
                    rx="15"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.76)" mask="url(#qlynk-tour-spotlight)" />
          </svg>

          {targetRect && (
            <motion.div
              className="pointer-events-none fixed rounded-2xl border-2 border-[#f46530] shadow-[0_0_0_4px_rgba(244,101,48,0.18),0_0_35px_rgba(244,101,48,0.38)]"
              animate={{
                left: targetRect.left,
                top: targetRect.top,
                width: targetRect.width,
                height: targetRect.height,
              }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
          )}

          {targetRect && (
            <motion.div
              key={step.target}
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`dashboard-tour-step-${stepIndex}`}
              className={`fixed z-[121] rounded-[1.75rem] border border-white/10 bg-[#111118] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.65)] ${isMobile && !mobileTargetIsLow ? 'bottom-4' : ''}`}
              style={{
                width: tooltipWidth,
                maxWidth: 'calc(100vw - 32px)',
                left: tooltipLeft,
                top: tooltipTop,
              }}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f46530]/20 bg-[#f46530]/10 text-[#f46530]">
                <StepIcon size={21} />
              </div>
              <button
                type="button"
                data-skip-tour
                onClick={() => saveStatus('skipped')}
                className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                Skip tour
              </button>
            </div>

            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#f46530]">{step.eyebrow}</p>
            <h2 id={`dashboard-tour-step-${stepIndex}`} className="mb-2 text-xl font-black leading-tight text-white">
              {step.title}
            </h2>
            <p className="text-sm leading-6 text-gray-400">{step.description}</p>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex + 1} of ${TOUR_STEPS.length}`}>
                {TOUR_STEPS.map((tourStep, index) => (
                  <span
                    key={tourStep.target}
                    className={`h-1.5 rounded-full transition-all ${index === stepIndex ? 'w-5 bg-[#f46530]' : index < stepIndex ? 'w-1.5 bg-[#f46530]/55' : 'w-1.5 bg-gray-700'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => current - 1)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Previous walkthrough step"
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}
                <button
                  ref={primaryButtonRef}
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f46530] px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-[#f57a4f]"
                >
                  {stepIndex === TOUR_STEPS.length - 1 ? (
                    <>
                      Finish
                      <Check size={17} />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
