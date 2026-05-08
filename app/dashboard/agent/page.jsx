'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getCurrentUser } from '@/lib/supabase';
import { 
  Bot, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  FileText,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Copy,
  Code
} from 'lucide-react';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function AgentConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  
  // Agent config state
  const [config, setConfig] = useState({
    agent_name: 'q-agent',
    agent_avatar: '',
    welcome_message: 'Hi! I\'m the AI assistant for this page. How can I help you?',
    bio: '',
    skills: [],
    projects: [],
    contact_info: {
      email: '',
      phone: '',
      location: '',
      website: '',
      calendly: ''
    },
    social_links: [],
    custom_knowledge: '',
    primary_color: '#f46530',
    position: 'bottom-right',
    is_enabled: true,
    tone: 'professional'
  });

  // Form input states for arrays
  const [newSkill, setNewSkill] = useState({ name: '', level: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '' });
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUserId(user.id);

        const supabase = createClient();
        
        // Get username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }

        // Get existing agent config
        const { data: existingConfig } = await supabase
          .from('agent_configs')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingConfig) {
          setConfig({
            ...config,
            ...existingConfig,
            skills: existingConfig.skills || [],
            projects: existingConfig.projects || [],
            contact_info: existingConfig.contact_info || {},
            social_links: existingConfig.social_links || [],
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading config:', error);
        setLoading(false);
      }
    };

    loadConfig();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    setSaveStatus(null);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('agent_configs')
        .upsert({
          user_id: userId,
          ...config,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('[v0] Error saving config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateContactInfo = (field, value) => {
    setConfig(prev => ({
      ...prev,
      contact_info: { ...prev.contact_info, [field]: value }
    }));
  };

  // Skills management
  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setConfig(prev => ({
      ...prev,
      skills: [...prev.skills, { ...newSkill }]
    }));
    setNewSkill({ name: '', level: '' });
  };

  const removeSkill = (index) => {
    setConfig(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Projects management
  const addProject = () => {
    if (!newProject.name.trim()) return;
    setConfig(prev => ({
      ...prev,
      projects: [...prev.projects, { ...newProject }]
    }));
    setNewProject({ name: '', description: '', url: '' });
  };

  const removeProject = (index) => {
    setConfig(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Social links management
  const addSocialLink = () => {
    if (!newSocialLink.platform.trim() || !newSocialLink.url.trim()) return;
    setConfig(prev => ({
      ...prev,
      social_links: [...prev.social_links, { ...newSocialLink }]
    }));
    setNewSocialLink({ platform: '', url: '' });
  };

  const removeSocialLink = (index) => {
    setConfig(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#f46530] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <UpgradePrompt />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            q-agent
            <Sparkles size={20} className="text-[#f46530]" />
          </h1>
          <p className="text-lg text-gray-400">Configure your AI assistant&apos;s personality and branding</p>
        </div>
            
            <div className="flex items-center gap-3">
              {username && (
                <a 
                  href={`/${username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-[#f46530]/50 hover:bg-gray-800 transition-all"
                >
                  <ExternalLink size={18} />
                  Preview
                </a>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#f46530] text-white rounded-xl font-semibold hover:bg-[#f46530]/90 shadow-lg shadow-[#f46530]/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : saveStatus === 'success' ? (
                  <CheckCircle size={18} />
                ) : saveStatus === 'error' ? (
                  <AlertCircle size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  config.is_enabled 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30' 
                    : 'bg-gray-700/50 border border-gray-600/50'
                }`}>
                  <Bot className={config.is_enabled ? 'text-green-400' : 'text-gray-500'} size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Agent Status
                    {config.is_enabled && <Sparkles size={16} className="text-[#f46530]" />}
                  </h3>
                  <p className="text-gray-400">
                    {config.is_enabled ? 'Your q-agent is live and visible to visitors' : 'Your q-agent is currently offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  config.is_enabled 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                }`}>
                  {config.is_enabled ? (
                    <>
                      <Eye size={16} />
                      Live
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} />
                      Offline
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => updateConfig('is_enabled', !config.is_enabled)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    config.is_enabled 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30' 
                      : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                    config.is_enabled ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Agent Branding */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-[#f46530]/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f46530]/10 rounded flex items-center justify-center">
                <Bot size={18} className="text-[#f46530]" />
              </div>
              Agent Branding
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Agent Name</label>
                <input
                  type="text"
                  value={config.agent_name}
                  onChange={(e) => updateConfig('agent_name', e.target.value)}
                  placeholder="q-agent"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => updateConfig('primary_color', e.target.value)}
                    className="w-12 h-12 rounded-xl border border-gray-700/50 bg-gray-900/50 cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => updateConfig('primary_color', e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Avatar URL (optional)</label>
                <input
                  type="url"
                  value={config.agent_avatar}
                  onChange={(e) => updateConfig('agent_avatar', e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Widget Position</label>
                <select
                  value={config.position}
                  onChange={(e) => updateConfig('position', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  AI Tone & Personality
                  <Sparkles size={14} className="text-[#f46530]" />
                </label>
                <select
                  value={config.tone || 'professional'}
                  onChange={(e) => updateConfig('tone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="professional">Professional (Polished & Formal)</option>
                  <option value="friendly">Friendly (Approachable & Warm)</option>
                  <option value="funny">Funny (Witty & Entertaining)</option>
                  <option value="creative">Creative (Visionary & Bold)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Welcome Message</label>
                <textarea
                  value={config.welcome_message}
                  onChange={(e) => updateConfig('welcome_message', e.target.value)}
                  placeholder="Hi! I'm the AI assistant for this page. How can I help you?"
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Bio & About */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-cyan-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-500/10 rounded flex items-center justify-center">
                <User size={18} className="text-cyan-400" />
              </div>
              About You
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea
                value={config.bio}
                onChange={(e) => updateConfig('bio', e.target.value)}
                placeholder="Tell visitors about yourself, your background, and what you do..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all resize-none"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-green-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center">
                <Briefcase size={18} className="text-green-400" />
              </div>
              Skills & Expertise
            </h2>
            
            {/* Existing skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {config.skills.map((skill, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-sm group/skill"
                >
                  <span>{skill.name}{skill.level && ` (${skill.level})`}</span>
                  <button 
                    onClick={() => removeSkill(index)}
                    className="text-green-400/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new skill */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Skill name (e.g., React, Python)"
                className="flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <input
                type="text"
                value={newSkill.level}
                onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                placeholder="Level (optional)"
                className="w-32 px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-purple-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded flex items-center justify-center">
                <FileText size={18} className="text-purple-400" />
              </div>
              Projects & Work
            </h2>
            
            {/* Existing projects */}
            <div className="space-y-3 mb-4">
              {config.projects.map((project, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-white">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-400">{project.description}</p>
                    )}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink size={10} />
                        {project.url}
                      </a>
                    )}
                  </div>
                  <button 
                    onClick={() => removeProject(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new project */}
            <div className="space-y-3 p-4 bg-gray-900/30 rounded-xl border border-dashed border-gray-700/50">
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Project name"
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <input
                type="text"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Short description"
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
              />
              <div className="flex gap-3">
                <input
                  type="url"
                  value={newProject.url}
                  onChange={(e) => setNewProject(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Project URL (optional)"
                  className="flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-gray-900 transition-all text-sm"
                />
                <button
                  onClick={addProject}
                  className="px-4 py-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-amber-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500/10 rounded flex items-center justify-center">
                <Mail size={18} className="text-amber-500" />
              </div>
              Contact Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Mail size={14} className="text-amber-500/70" />
                  Email
                </label>
                <input
                  type="email"
                  value={config.contact_info.email || ''}
                  onChange={(e) => updateContactInfo('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Phone size={14} className="text-amber-500/70" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={config.contact_info.phone || ''}
                  onChange={(e) => updateContactInfo('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500/70" />
                  Location
                </label>
                <input
                  type="text"
                  value={config.contact_info.location || ''}
                  onChange={(e) => updateContactInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-amber-500/70" />
                  Website
                </label>
                <input
                  type="url"
                  value={config.contact_info.website || ''}
                  onChange={(e) => updateContactInfo('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500/70" />
                  Booking Link (Calendly, Cal.com, etc.)
                </label>
                <input
                  type="url"
                  value={config.contact_info.calendly || ''}
                  onChange={(e) => updateContactInfo('calendly', e.target.value)}
                  placeholder="https://calendly.com/yourname"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-gray-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-[#f46530]/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f46530]/10 rounded flex items-center justify-center">
                <Globe size={18} className="text-[#f46530]" />
              </div>
              Social Links
            </h2>
            
            {/* Existing social links */}
            <div className="space-y-2 mb-4">
              {config.social_links.map((link, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-[#f46530]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white capitalize">{link.platform}</span>
                    <span className="text-xs text-gray-400">{link.url}</span>
                  </div>
                  <button 
                    onClick={() => removeSocialLink(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add new social link */}
            <div className="flex gap-3">
              <select
                value={newSocialLink.platform}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, platform: e.target.value }))}
                className="w-40 px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Platform</option>
                <option value="twitter">Twitter/X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="dribbble">Dribbble</option>
                <option value="behance">Behance</option>
                <option value="other">Other</option>
              </select>
              <input
                type="url"
                value={newSocialLink.url}
                onChange={(e) => setNewSocialLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Profile URL"
                className="flex-1 px-4 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all text-sm"
              />
              <button
                onClick={addSocialLink}
                className="px-4 py-2.5 bg-[#f46530]/10 text-[#f46530] border border-[#f46530]/20 rounded-xl hover:bg-[#f46530]/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Custom Knowledge */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 hover:border-blue-500/20 transition-all">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                <FileText size={18} className="text-blue-400" />
              </div>
              Custom Knowledge
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Add any additional information you want your agent to know. This could include FAQs, 
              detailed service descriptions, pricing info, or anything else visitors might ask about.
            </p>
            <textarea
              value={config.custom_knowledge}
              onChange={(e) => updateConfig('custom_knowledge', e.target.value)}
              placeholder="Enter any additional information for your agent..."
              rows={6}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-gray-900 transition-all resize-none"
            />
          </div>

          {/* Document Upload Section - Link to dedicated page */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-12 hover:border-[#f46530]/20 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#f46530]/10 rounded-xl flex items-center justify-center">
                  <Upload size={28} className="text-[#f46530]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
                  <p className="text-gray-400">Upload PDFs, text files, or documents to expand knowledge</p>
                </div>
              </div>
              <a
                href="/dashboard/agent/documents"
                className="flex items-center gap-2 px-6 py-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white hover:border-[#f46530]/50 hover:bg-gray-900 transition-all font-semibold group"
              >
                <Upload size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                Manage Documents
              </a>
            </div>
          </div>
          {/* Share & Embed Section */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-20 hover:border-[#f46530]/20 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f46530]/10 rounded-xl flex items-center justify-center">
                    <Code size={22} className="text-[#f46530]" />
                  </div>
                  Share & Embed
                </h2>
                <p className="text-gray-400 mb-6 max-w-2xl text-lg">
                  Integrate your q-agent on any website by adding this small script tag to your HTML. 
                  It will automatically add the chat widget to your site.
                </p>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#f46530]/20 to-orange-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-900/80 border border-gray-700/50 rounded-xl p-6 font-mono text-sm overflow-x-auto custom-scrollbar">
                    <pre className="text-gray-300">
                      {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/q-agent.js" data-username="${username}" defer><\/script>`}
                    </pre>
                    <button 
                      onClick={() => {
                        const code = `<script src="${window.location.origin}/q-agent.js" data-username="${username}" defer><\/script>`;
                        navigator.clipboard.writeText(code);
                      }}
                      className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg border border-gray-700 transition-all"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center">
                        <Globe size={14} className="text-gray-500" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Works on WordPress, Webflow, Shopify, and custom sites</p>
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-3">
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/${username}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white hover:border-[#f46530]/50 hover:bg-gray-800 transition-all font-bold"
                >
                  <Copy size={18} />
                  Copy Profile Link
                </button>
                <a 
                  href={`/${username}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#f46530]/10 border border-[#f46530]/30 rounded-xl text-[#f46530] hover:bg-[#f46530]/20 transition-all font-bold"
                >
                  <ExternalLink size={18} />
                  View Public Page
                </a>
            </div>
          </div>
        </div>
      </div>
    );
}
