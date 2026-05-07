'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Code, Palette, Zap, Github, Linkedin, Twitter } from 'lucide-react';
import { premiumTemplates } from '../../components/PremiumTemplates';

const PremiumThemesDemo = () => {
  const [selectedTheme, setSelectedTheme] = useState('cosmicFlow');

  const demoData = {
    name: "Alex Johnson",
    profession: "Creative Developer",
    tagline: "Building digital experiences that inspire",
    bio: "Passionate about creating beautiful, functional web experiences. I combine design thinking with technical expertise to build products that users love.",
    email: "alex@example.com",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    links: [
      {
        title: "Portfolio Website",
        description: "See my latest projects and case studies",
        url: "#"
      },
      {
        title: "GitHub Profile",
        description: "Check out my open source work",
        url: "#"
      },
      {
        title: "Design Blog",
        description: "Thoughts on design and development",
        url: "#"
      }
    ],
    socialLinks: [
      { icon: Github, url: "#" },
      { icon: Linkedin, url: "#" },
      { icon: Twitter, url: "#" }
    ],
    cta: "Let's Work Together"
  };

  const themes = [
    {
      key: 'cosmicFlow',
      name: 'Cosmic Flow',
      description: '3D space with particle constellations',
      icon: <Sparkles className="text-purple-500" size={24} />,
      features: ['3D Particle System', 'Mouse Interaction', 'Dynamic Background', 'Smooth Animations']
    },
    {
      key: 'glassMorphism',
      name: 'Glass Morphism',
      description: 'Advanced glass effects with depth',
      icon: <Palette className="text-blue-500" size={24} />,
      features: ['Blur Effects', 'Floating Elements', 'Parallax Scrolling', 'Glass Cards']
    },
    {
      key: 'neonCity',
      name: 'Neon City',
      description: 'Cyberpunk aesthetic with neon lights',
      icon: <Zap className="text-cyan-500" size={24} />,
      features: ['Glitch Effects', 'Neon Glow', 'Animated Grid', 'Cyberpunk Style']
    }
  ];

  const SelectedThemeComponent = premiumTemplates[selectedTheme];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="text-purple-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">Premium Themes</h1>
                <p className="text-purple-300">Advanced animations and effects</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles size={20} />
              <span className="text-sm font-semibold">PRO FEATURE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Theme Selector */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Choose a Premium Theme</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <motion.div
                key={theme.key}
                className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border cursor-pointer transition-all ${
                  selectedTheme === theme.key
                    ? 'border-purple-500 bg-white/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onClick={() => setSelectedTheme(theme.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {theme.icon}
                  <div>
                    <h3 className="text-xl font-bold text-white">{theme.name}</h3>
                    <p className="text-gray-300 text-sm">{theme.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {theme.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-purple-300">
                      <Sparkles size={12} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Live Preview</h3>
            <div className="flex items-center gap-2 text-purple-400">
              <Code size={20} />
              <span className="text-sm font-mono">{selectedTheme}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl overflow-hidden" style={{ height: '600px' }}>
            <div className="h-full overflow-y-auto">
              <SelectedThemeComponent data={demoData} />
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <motion.div
          className="mt-12 text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Unlock Premium?</h3>
          <p className="text-purple-300 mb-6 max-w-2xl mx-auto">
            Get access to all premium themes, advanced animations, and priority support. 
            Create a truly unique and professional online presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              Upgrade to Pro - $9/month
            </button>
            <button className="border border-purple-500 text-purple-400 px-8 py-3 rounded-lg font-semibold hover:bg-purple-500/10 transition-all">
              View All Features
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumThemesDemo;
