'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Lock, Check } from 'lucide-react';
import { PremiumBadge } from './PremiumTemplates';

const ThemeSelector = ({ selectedTheme, onThemeChange, isPremium = false }) => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const themeMetadata = {
    // Free themes
    professional: {
      name: 'Professional',
      description: 'Clean and corporate',
      preview: 'bg-gradient-to-br from-blue-50 to-slate-100',
      isPremium: false
    },
    creative: {
      name: 'Creative',
      description: 'Artistic and vibrant',
      preview: 'bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100',
      isPremium: false
    },
    minimalist: {
      name: 'Minimalist',
      description: 'Simple and elegant',
      preview: 'bg-white',
      isPremium: false
    },
    dark: {
      name: 'Dark',
      description: 'Modern and sleek',
      preview: 'bg-slate-950',
      isPremium: false
    },
    vibrant: {
      name: 'Vibrant',
      description: 'Bold and colorful',
      preview: 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600',
      isPremium: false
    },
    // Premium themes
    cosmicFlow: {
      name: 'Cosmic Flow',
      description: '3D space with particles',
      preview: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      isPremium: true,
      features: ['3D Particles', 'Mouse Interaction', 'Dynamic Background']
    },
    glassMorphism: {
      name: 'Glass Morphism',
      description: 'Advanced glass effects',
      preview: 'bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100',
      isPremium: true,
      features: ['Blur Effects', 'Floating Elements', 'Parallax Scrolling']
    },
    neonCity: {
      name: 'Neon City',
      description: 'Cyberpunk aesthetic',
      preview: 'bg-black',
      isPremium: true,
      features: ['Glitch Effects', 'Neon Glow', 'Animated Grid']
    }
  };

  const handleThemeClick = (themeKey) => {
    const theme = themeMetadata[themeKey];
    if (theme.isPremium && !isPremium) {
      setShowPremiumModal(true);
    } else {
      onThemeChange(themeKey);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-2">Choose Your Theme</h3>
          <p className="text-muted-foreground">Select a design that matches your style</p>
        </div>

        {/* Premium indicator */}
        {!isPremium && (
          <motion.div 
            className="rounded-xl p-4 border border-border cursor-pointer bg-card/80"
            onClick={() => setShowPremiumModal(true)}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="text-bright-orange" size={24} />
                <div>
                  <h4 className="font-bold text-foreground">Upgrade to Pro</h4>
                  <p className="text-muted-foreground text-sm">Unlock 3 premium themes with advanced animations</p>
                </div>
              </div>
              <PremiumBadge />
            </div>
          </motion.div>
        )}

        {/* Theme grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(themeMetadata).map(([key, theme]) => (
            <motion.div
              key={key}
              className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                selectedTheme === key
                  ? 'border-bright-orange shadow-lg bg-card/80'
                  : 'border-border hover:border-border bg-card/70'
              } ${theme.isPremium && !isPremium ? 'opacity-75' : ''}`}
              onClick={() => handleThemeClick(key)}
              whileHover={{ scale: theme.isPremium && !isPremium ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Preview */}
              <div className={`h-24 rounded-lg mb-3 ${theme.preview} relative overflow-hidden border border-border`}> 
                {theme.isPremium && !isPremium && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Lock className="text-white" size={24} />
                  </div>
                )}
                {selectedTheme === key && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded-full">
                    <Check size={16} />
                  </div>
                )}
              </div>
              
              {/* Theme info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{theme.name}</h4>
                  {theme.isPremium && <PremiumBadge />}
                </div>
                <p className="text-muted-foreground text-sm">{theme.description}</p>
                
                {/* Premium features */}
                {theme.isPremium && theme.features && (
                  <div className="space-y-1">
                    {theme.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-purple-600">
                        <Sparkles size={12} />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Premium modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                  <Crown className="text-white" size={32} />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to qlynk Pro</h3>
                  <p className="text-gray-600">
                    Unlock premium themes with advanced animations and features
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-left">
                    <Sparkles className="text-purple-600" size={20} />
                    <span className="text-gray-700">3 Premium Themes</span>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <Sparkles className="text-purple-600" size={20} />
                    <span className="text-gray-700">Advanced Animations</span>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <Sparkles className="text-purple-600" size={20} />
                    <span className="text-gray-700">3D Effects & Particles</span>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <Sparkles className="text-purple-600" size={20} />
                    <span className="text-gray-700">Priority Support</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPremiumModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      // Handle upgrade logic here
                      alert('Redirecting to payment...');
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThemeSelector;