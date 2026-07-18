'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Pause, Zap, Crown, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrialChoiceManager({ subscription, userId }) {
  const [choice, setChoice] = useState(subscription?.post_trial_choice || 'pause');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(false);

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

  const selectedChoice = choices.find((item) => item.id === choice) || choices[0];

  return (
    <div className="bg-white/[0.035] backdrop-blur-sm rounded-2xl border border-white/10 mb-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <selectedChoice.icon size={18} className="text-amber-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">Trial plan preference</h3>
            <p className="text-gray-400 text-xs sm:text-sm truncate">
              After your trial: <span className="text-gray-200">{selectedChoice.name}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-white/10 transition-colors"
        >
          {expanded ? 'Hide options' : 'Change preference'}
          <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
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

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-3 gap-3 px-5 pb-5 pt-1 border-t border-white/5">
              {choices.map((item) => {
                const Icon = item.icon;
                const isActive = choice === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleChoiceUpdate(item.id)}
                    disabled={loading}
                    className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                      isActive ? item.activeColor : `${item.color} ${item.borderColor} opacity-70 hover:opacity-100`
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-white/10' : 'bg-black/20'}`}>
                      <Icon className={isActive ? 'text-white' : 'text-gray-400'} size={18} />
                    </div>
                    <div className="pr-5">
                      <h4 className="font-bold text-white text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <Check size={14} className="text-gray-900" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
