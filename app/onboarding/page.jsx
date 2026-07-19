'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from '@/lib/supabase';
import QlynkBackground from '@/components/QlynkBackground';
import { AGENT_TYPE_CATALOG, DEFAULT_AGENT_TYPE, getAgentTypeDefinition } from '@/lib/agent-type-catalog';
import { normalizeAgentRules } from '@/lib/agent-rules';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Brain, 
  Rocket,
  Check,
  Loader2
} from 'lucide-react';

const STEPS = [
  { id: 'profile', label: 'Basics', icon: User },
  { id: 'knowledge', label: 'Knowledge', icon: Brain },
  { id: 'complete', label: 'Publish', icon: Rocket },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    // Profile
    agent_type: DEFAULT_AGENT_TYPE,
    full_name: '',
    bio: '',
    // Knowledge
    skills: [],
    projects: [],
    custom_knowledge: '',
    // Branding
    agent_name: 'Your AI',
    welcome_message: "Hi! I'm the AI assistant for this page. How can I help you?",
    primary_color: '#f46530',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      const supabase = createClient();
      
      // Check if onboarding is already complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, onboarding_completed, onboarding_step, full_name')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      if (profile?.username) {
        setUsername(profile.username);
      }
      if (profile?.full_name) {
        setFormData(prev => ({ ...prev, full_name: profile.full_name }));
      }

      // Load existing agent config if any
      const { data: agentConfig } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (agentConfig) {
        setFormData(prev => ({
          ...prev,
          agent_type: agentConfig.agent_type || DEFAULT_AGENT_TYPE,
          bio: agentConfig.bio || '',
          skills: agentConfig.skills || [],
          projects: agentConfig.projects || [],
          custom_knowledge: agentConfig.custom_knowledge || '',
          agent_name: agentConfig.agent_name || 'Your AI',
          welcome_message: agentConfig.welcome_message || "Hi! I'm the AI assistant for this page. How can I help you?",
          primary_color: agentConfig.primary_color || '#f46530',
        }));
      }

      // Set step based on saved progress
      if (profile?.onboarding_step) {
        const resumedStep = profile.onboarding_step === 'branding'
          ? 'complete'
          : profile.onboarding_step === 'welcome'
            ? 'profile'
            : profile.onboarding_step;
        const stepIndex = STEPS.findIndex(s => s.id === resumedStep);
        if (stepIndex > 0) setCurrentStep(stepIndex);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const saveProgress = async (step) => {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ onboarding_step: step })
      .eq('id', userId);
  };

  const saveAgentConfig = async () => {
    setSaving(true);
    const supabase = createClient();
    
    // Update profile
    await supabase
      .from('profiles')
      .update({ full_name: formData.full_name })
      .eq('id', userId);

    // Upsert agent config
    await supabase
      .from('agent_configs')
      .upsert({
        user_id: userId,
        agent_type: formData.agent_type || DEFAULT_AGENT_TYPE,
        bio: formData.bio,
        skills: formData.skills,
        projects: formData.projects,
        custom_knowledge: formData.custom_knowledge,
        agent_name: formData.agent_name === 'Your AI' && formData.full_name.trim()
          ? `${formData.full_name.trim()}'s AI`
          : formData.agent_name,
        welcome_message: formData.welcome_message,
        primary_color: formData.primary_color,
        cta_button_color: formData.primary_color,
        is_enabled: true,
      }, { onConflict: 'user_id' });

    setSaving(false);
  };

  const saveAgentRules = async () => {
    const agentType = formData.agent_type || DEFAULT_AGENT_TYPE;
    const response = await fetch('/api/agent/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_type: agentType,
        rules: normalizeAgentRules({
          purpose: getAgentTypeDefinition(agentType).defaultPurpose,
        }, agentType),
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Unable to save agent type');
    }
  };

  const savePageData = async () => {
    const supabase = createClient();
    
    // Upsert public page data
    await supabase
      .from('pages')
      .upsert({
        user_id: userId,
        name: formData.full_name || username,
        tagline: formData.bio?.substring(0, 100) || 'Welcome to my page',
        profession: formData.full_name ? 'Professional' : '',
        theme: 'quickpitch',
        theme_category: 'freelancers',
        theme_data: {
          config_version: 'v1',
          headline: formData.full_name || username,
          subhead: formData.bio || 'Welcome to my page',
          email: '', // Optional during onboarding
        },
        is_published: true
      }, { onConflict: 'user_id' });
  };

  const completeOnboarding = async () => {
    setSaving(true);
    const supabase = createClient();
    
    // Save final config
    await saveAgentConfig();
    await saveAgentRules();
    await savePageData();
    
    // Mark onboarding complete
    await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        onboarding_step: 'complete',
        dashboard_tour_status: 'pending',
        dashboard_tour_version: 1,
        dashboard_tour_completed_at: null,
      })
      .eq('id', userId);

    router.push('/dashboard');
  };

  const handleSkip = async () => {
    setSaving(true);
    const supabase = createClient();
    
    // Mark onboarding complete so dashboard allows access
    await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        onboarding_step: 'skipped',
        dashboard_tour_status: 'pending',
        dashboard_tour_version: 1,
        dashboard_tour_completed_at: null,
      })
      .eq('id', userId);

    // Ensure a page exists even on skip
    await saveAgentRules();
    await savePageData();

    router.push('/dashboard');
  };

  const nextStep = async () => {
    if (currentStep < STEPS.length - 1) {
      await saveAgentConfig();
      await saveProgress(STEPS[currentStep + 1].id);
      
      const newStep = currentStep + 1;
      setCurrentStep(newStep);

      // Trigger celebration on final step
      if (STEPS[newStep].id === 'complete') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f46530', '#ffffff', '#3b82f6']
        });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#090a0f] text-white">
      {/* Background - neon lines, particles and gradient orbs matching homepage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <QlynkBackground />
        <div className="gradient-sphere sphere-1" />
        <div className="gradient-sphere sphere-2" />
        <div className="gradient-sphere sphere-3" />
        <div className="grid-overlay" />
        <div className="absolute inset-0 bg-[#090a0f]/55" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/">
          <Image width={120} height={40} src="/logoWhite.svg" alt="Qlynk AI logo" priority />
        </Link>
        {currentStep < STEPS.length - 1 && (
          <button
            onClick={handleSkip}
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 text-sm font-semibold transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Processing...' : 'Set up later'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <div className="rounded-2xl border border-white/15 bg-[#11131b]/90 px-4 sm:px-6 pt-4 sm:pt-5 pb-5 sm:pb-9 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="flex sm:hidden items-center justify-between mb-4 text-xs font-bold uppercase tracking-widest">
            <span className="text-gray-300">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-orange">{STEPS[currentStep].label}</span>
          </div>
          <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="relative group">
                  <motion.div 
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500 border ${
                      isComplete 
                        ? 'bg-green/20 border-green text-green'
                        : isActive 
                          ? 'bg-orange/20 border-orange text-orange shadow-[0_0_20px_rgba(244,101,48,0.35)]'
                          : 'bg-white/[0.07] border-white/15 text-gray-300'
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  {/* Tooltip-like label for mobile/tablet */}
                  <span className={`hidden sm:block absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap uppercase tracking-widest font-black transition-colors ${
                    isActive ? 'text-orange' : isComplete ? 'text-green' : 'text-gray-300'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4 h-[2px] bg-white/15 relative overflow-hidden rounded-full">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-orange to-green"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isComplete ? 1 : 0 }}
                      style={{ originX: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-4 sm:mx-auto px-5 sm:px-8 py-7 sm:py-9 bg-[#11131b]/95 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.45)] mb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Basics */}
            {currentStep === 0 && (
              <div>
                <div className="w-16 h-16 bg-orange/15 border border-orange/25 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(235,94,40,0.14)]">
                  <Sparkles className="w-8 h-8 text-orange" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 text-center break-words">
                  Let&apos;s create your agent, {username}
                </h1>
                <p className="text-gray-200 mb-8 text-center max-w-lg mx-auto leading-relaxed">
                  Start with three simple details. Everything else can be customized later.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">Who or what does this agent represent?</label>
                    <select
                      value={formData.agent_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, agent_type: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-[#090b11] border border-white/20 rounded-xl text-white focus:border-orange focus:ring-2 focus:ring-orange/25 focus:outline-none transition-all"
                    >
                      {AGENT_TYPE_CATALOG.map((type) => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-gray-300 text-sm leading-relaxed mt-2">
                      {getAgentTypeDefinition(formData.agent_type).description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">Name or business</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="e.g. John Doe or Acme Studio"
                      className="w-full px-4 py-3.5 bg-[#090b11] border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/25 focus:outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">Short description</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="What should visitors know about you, your business, or this place?"
                      rows={3}
                      className="w-full px-4 py-3.5 bg-[#090b11] border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/25 focus:outline-none resize-none transition-all"
                    />
                    <p className="text-gray-300 text-sm leading-relaxed mt-2">A sentence or two is enough to get started.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Starter knowledge */}
            {currentStep === 1 && (
              <div>
                <div className="w-16 h-16 bg-blue-500/15 border border-blue-400/25 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-blue-300" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 text-center">Add one useful starting point</h2>
                <p className="text-gray-200 mb-8 text-center max-w-lg mx-auto leading-relaxed">
                  Paste anything your agent should know first. This step is optional—you can build its knowledge over time.
                </p>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <label className="block text-white font-semibold">Quick context</label>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-300 bg-white/[0.07] border border-white/10 px-3 py-1 rounded-full">Optional</span>
                    </div>
                    <textarea
                      value={formData.custom_knowledge}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_knowledge: e.target.value }))}
                      placeholder="For example: what you offer, common questions, opening hours, current projects, or anything visitors often ask about..."
                      rows={8}
                      className="w-full px-4 py-3.5 bg-[#090b11] border border-white/20 rounded-xl text-white placeholder:text-gray-400 focus:border-orange focus:ring-2 focus:ring-orange/25 focus:outline-none resize-none transition-all"
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-white/[0.06] border border-white/10 p-4">
                    <Sparkles className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-200 leading-relaxed">
                      After publishing, you can add documents, website links, FAQs, skills, projects, and more from the Knowledge Base.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review and publish */}
            {currentStep === 2 && (
              <div className="text-center py-8">
                <div className="relative inline-block mb-10">
                  <motion.div 
                    className="absolute inset-0 bg-green/30 blur-3xl rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative w-24 h-24 bg-green rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(34,197,94,0.3)]">
                    <Rocket className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                  Your agent is ready to launch
                </h1>
                <p className="text-lg text-gray-200 mb-8 max-w-md mx-auto leading-relaxed">
                  We&apos;ve applied smart defaults so you can publish now and customize the advanced options whenever you&apos;re ready.
                </p>

                <div className="max-w-md mx-auto mb-8 grid gap-3 text-left">
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3">
                    <Check className="w-5 h-5 text-green flex-shrink-0" />
                    <span className="text-gray-100">Basic identity and agent type saved</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3">
                    <Check className="w-5 h-5 text-green flex-shrink-0" />
                    <span className="text-gray-100">
                      {formData.custom_knowledge.trim() ? 'Starter knowledge added' : 'Ready with safe starter defaults'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3">
                    <Sparkles className="w-5 h-5 text-orange flex-shrink-0" />
                    <span className="text-gray-100">Advanced tools remain available in your dashboard</span>
                  </div>
                </div>
                
                <div className="relative group mb-8 inline-block max-w-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange to-[#c14f22] rounded-2xl blur opacity-25" />
                  <div className="relative bg-[#090b11] border border-white/20 rounded-2xl px-5 sm:px-8 py-4 flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
                    <span className="text-orange font-mono text-base sm:text-lg font-bold tracking-tight truncate">qlynk.site/{username}</span>
                  </div>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <button
                    onClick={completeOnboarding}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-3 bg-orange text-white px-8 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-orange/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <span className="sm:hidden">Publish agent</span>
                        <span className="hidden sm:inline">Publish &amp; open dashboard</span>
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={prevStep}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/[0.06] transition-all disabled:opacity-50"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < STEPS.length - 1 && (
          <div className="flex justify-between mt-12">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                currentStep === 0 
                  ? 'text-gray-500 cursor-not-allowed border border-transparent'
                  : 'text-gray-100 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-orange to-[#c94b1d] hover:from-[#d84f1e] hover:to-[#a83c18] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {currentStep === 0 ? 'Continue' : 'Review & publish'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
