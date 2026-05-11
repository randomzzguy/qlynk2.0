'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Pause, Zap, Crown, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrialChoiceManager({ subscription, userId }) {
  const [choice, setChoice] = useState(subscription?.post_trial_choice || 'pause');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const choices = [
    {
      id: 'pause',
      name: 'Pause Account',
      description: 'Agent goes offline. Data saved for 14 extra days.',
      icon: Pause,
      color: 'bg-gray-700',
      borderColor: 'border-gray-600',
      activeColor: 'bg-gray-600 border-gray-400',
    },
    {
      id: 'creator',
      name: 'Creator Plan',
      description: '$9/mo after trial. For pros & creators.',
      icon: Zap,
      color: 'bg-emerald-900/30',
      borderColor: 'border-emerald-500/30',
      activeColor: 'bg-emerald-500/20 border-emerald-500',
    },
    {
      id: 'agency',
      name: 'Agency Plan',
      description: '$19/mo after trial. For teams & agencies.',
      icon: Crown,
      color: 'bg-purple-900/30',
      borderColor: 'border-purple-500/30',
      activeColor: 'bg-purple-500/20 border-purple-500',
    },
  ];

  const handleChoiceUpdate = async (newChoice) => {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('subscriptions')
        .update({ post_trial_choice: newChoice })
        .eq('user_id', userId);

      if (error) throw error;
      
      setChoice(newChoice);
      setMessage({ type: 'success', text: 'Choice updated successfully!' });
    } catch (error) {
      console.error('Error updating choice:', error);
      setMessage({ type: 'error', text: 'Failed to update choice.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (subscription?.tier !== 'trial') return null;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Trial Ending Soon?</h3>
          <p className="text-gray-400 text-sm">Choose what happens when your 14-day trial ends.</p>
        </div>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {choices.map((item) => {
          const Icon = item.icon;
          const isActive = choice === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleChoiceUpdate(item.id)}
              disabled={loading}
              className={`relative flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left ${
                isActive ? item.activeColor : `${item.color} ${item.borderColor} opacity-60 hover:opacity-100`
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <Check size={14} className="text-gray-900" />
                </div>
              )}
              <div className={`p-2 rounded-lg mb-3 ${isActive ? 'bg-white/10' : 'bg-black/20'}`}>
                <Icon className={isActive ? 'text-white' : 'text-gray-400'} size={20} />
              </div>
              <h4 className="font-bold text-white mb-1">{item.name}</h4>
              <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
