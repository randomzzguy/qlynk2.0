'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from '@/lib/supabase';
import QlynkBackground from '@/components/QlynkBackground';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  User, 
  Brain, 
  Palette, 
  Rocket,
  Check,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'knowledge', label: 'Knowledge', icon: Brain },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'complete', label: 'Go Live', icon: Rocket },
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
    full_name: '',
    bio: '',
    // Knowledge
    skills: [],
    projects: [],
    custom_knowledge: '',
    // Branding
    agent_name: 'Q-Agent',
    welcome_message: "Hi! I'm the AI assistant for this page. How can I help you?",
    primary_color: '#f46530',
  });

  // Temp inputs
  const [newSkill, setNewSkill] = useState('');
  const [newProject, setNewProject] = useState({ name: '', description: '' });

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
          bio: agentConfig.bio || '',
          skills: agentConfig.skills || [],
          projects: agentConfig.projects || [],
          custom_knowledge: agentConfig.custom_knowledge || '',
          agent_name: agentConfig.agent_name || 'Q-Agent',
          welcome_message: agentConfig.welcome_message || "Hi! I'm the AI assistant for this page. How can I help you?",
          primary_color: agentConfig.primary_color || '#f46530',
        }));
      }

      // Set step based on saved progress
      if (profile?.onboarding_step) {
        const stepIndex = STEPS.findIndex(s => s.id === profile.onboarding_step);
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
        bio: formData.bio,
        skills: formData.skills,
        projects: formData.projects,
        custom_knowledge: formData.custom_knowledge,
        agent_name: formData.agent_name,
        welcome_message: formData.welcome_message,
        primary_color: formData.primary_color,
        is_enabled: true,
      }, { onConflict: 'user_id' });

    setSaving(false);
  };

  const completeOnboarding = async () => {
    setSaving(true);
    const supabase = createClient();
    
    // Save final config
    await saveAgentConfig();
    
    // Mark onboarding complete
    await supabase
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        onboarding_step: 'complete'
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
        onboarding_step: 'skipped'
      })
      .eq('id', userId);

    router.push('/dashboard');
  };

  const nextStep = async () => {
    if (currentStep < STEPS.length - 1) {
      await saveAgentConfig();
      await saveProgress(STEPS[currentStep + 1].id);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, { name: newSkill.trim(), level: 'intermediate' }]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    if (newProject.name.trim()) {
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, { ...newProject }]
      }));
      setNewProject({ name: '', description: '' });
    }
  };

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f0f14]">
      {/* Background - neon lines, particles and gradient orbs matching homepage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <QlynkBackground />
        <div className="gradient-sphere sphere-1" />
        <div className="gradient-sphere sphere-2" />
        <div className="gradient-sphere sphere-3" />
        <div className="grid-overlay" />
      </div>
      
      {/* Header */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Image width={120} height={40} src="/logoWhite.svg" alt="qlynk logo" priority />
        </Link>
        <button 
          onClick={handleSkip}
          className="text-gray-400 hover:text-white text-sm transition-colors"
          disabled={saving}
        >
          {saving ? 'Processing...' : 'Skip for now'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  isComplete ? 'bg-green-500' : isActive ? 'bg-orange-500' : 'bg-gray-700'
                }`}>
                  {isComplete ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 md:w-20 h-1 mx-1 rounded ${
                    isComplete ? 'bg-green-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {STEPS.map((step, index) => (
            <span key={step.id} className={index === currentStep ? 'text-orange-500 font-semibold' : ''}>
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8 semi-translucent-card rounded-2xl border border-white/10 mb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <div className="text-center">
                <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="w-12 h-12 text-orange-500" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4">
                  Welcome to Qlynk, {username}!
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
                  Let&apos;s set up your Q-Agent in just a few steps. Your AI ambassador will be ready to chat with visitors 24/7.
                </p>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-left max-w-md mx-auto">
                  <h3 className="font-bold text-white mb-4">What we&apos;ll cover:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-300">
                      <User className="w-5 h-5 text-orange-500" />
                      Your profile and bio
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Brain className="w-5 h-5 text-orange-500" />
                      Skills and projects for your agent
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Palette className="w-5 h-5 text-orange-500" />
                      Branding and appearance
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Rocket className="w-5 h-5 text-orange-500" />
                      Go live!
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 1: Profile */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-3xl font-black text-white mb-2 text-center">Tell us about yourself</h2>
                <p className="text-gray-400 mb-8 text-center">This helps your Q-Agent introduce you to visitors.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">Bio / About You</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="I'm a software developer passionate about building great products..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                    />
                    <p className="text-gray-500 text-sm mt-2">This will be the foundation of your agent&apos;s knowledge about you.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Knowledge */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-3xl font-black text-white mb-2 text-center">Train Your Agent</h2>
                <p className="text-gray-400 mb-8 text-center">Add your skills and projects so visitors can learn about your work.</p>
                
                <div className="space-y-8">
                  {/* Skills */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Skills</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="e.g., React, Python, UI Design"
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={addSkill}
                        className="px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-gray-300">
                          {skill.name}
                          <button onClick={() => removeSkill(index)} className="hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <label className="block text-white font-semibold mb-3">Projects</label>
                    <div className="space-y-3 mb-3">
                      <input
                        type="text"
                        value={newProject.name}
                        onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Project name"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newProject.description}
                          onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description"
                          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                        />
                        <button
                          onClick={addProject}
                          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
                        >
                          <Plus className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {formData.projects.map((project, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-xl">
                          <div>
                            <p className="font-semibold text-white">{project.name}</p>
                            <p className="text-sm text-gray-400">{project.description}</p>
                          </div>
                          <button onClick={() => removeProject(index)} className="text-gray-400 hover:text-red-400">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Knowledge */}
                  <div>
                    <label className="block text-white font-semibold mb-2">Additional Information (Optional)</label>
                    <textarea
                      value={formData.custom_knowledge}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_knowledge: e.target.value }))}
                      placeholder="Any other information you want your agent to know..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Branding */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-3xl font-black text-white mb-2 text-center">Customize Your Agent</h2>
                <p className="text-gray-400 mb-8 text-center">Make your Q-Agent feel personal and on-brand.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={formData.agent_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                      placeholder="Q-Agent"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">Welcome Message</label>
                    <textarea
                      value={formData.welcome_message}
                      onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                      placeholder="Hi! I'm the AI assistant for this page. How can I help you?"
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">Primary Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-700"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <p className="text-gray-400 text-sm mb-4">Preview</p>
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        {formData.agent_name.charAt(0)}
                      </div>
                      <div className="flex-1 p-3 bg-gray-700 rounded-xl rounded-tl-none">
                        <p className="text-white text-sm">{formData.welcome_message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <div className="text-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Rocket className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4">
                  You&apos;re All Set!
                </h1>
                <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
                  Your Q-Agent is ready to go live. Visitors can now chat with your AI ambassador at:
                </p>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 mb-8 inline-block">
                  <p className="text-orange-500 font-mono text-lg">qlynk.site/{username}</p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={completeOnboarding}
                    disabled={saving}
                    className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-12">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                currentStep === 0 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {currentStep === 0 ? "Let's Go" : 'Continue'}
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
