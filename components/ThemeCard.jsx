'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * Theme Selection Card Component
 */
export default function ThemeCard({ theme, selected, onClick }) {
    return (
        <motion.div
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${selected
                    ? 'border-[#f46530] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
            onClick={onClick}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Selected Indicator */}
            {selected && (
                <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-[#f46530] rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    <Check size={20} className="text-white" />
                </motion.div>
            )}

            {/* Theme Preview - Placeholder for now */}
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center text-4xl">
                {theme.id === 'quickpitch' && '⚡'}
                {theme.id === 'skillstack' && '💻'}
                {theme.id === 'hiremenow' && '🎯'}
                {theme.id === 'storybuilder' && '📖'}
                {theme.id === 'localpro' && '📍'}
                {theme.id === 'sidehustle' && '🎨'}
                {theme.id === 'gallerygrid' && '🖼️'}
                {theme.id === 'casestudy' && '📊'}
                {theme.id === 'minimalistcv' && '📄'}
                {theme.id === 'motionreel' && '🎬'}
                {theme.id === 'interactivedemo' && '🎮'}
                {theme.id === 'narrativescroll' && '📜'}
                {theme.id === 'launchpad' && '🚀'}
                {theme.id === 'featurefocus' && '✨'}
                {theme.id === 'digitaldownload' && '📥'}
                {theme.id === 'hardwareshowcase' && '📱'}
                {theme.id === 'opensource' && '🔓'}
                {theme.id === 'nichetool' && '🔧'}
                {theme.id === 'localbiz' && '🏪'}
                {theme.id === 'serviceco' && '💼'}
                {theme.id === 'ecobrand' && '🌱'}
                {theme.id === 'eventspace' && '🎪'}
                {theme.id === 'franchisehub' && '🏢'}
                {theme.id === 'legacyco' && '🏛️'}
            </div>

            {/* Theme Info */}
            <h3 className="text-xl font-black mb-2">{theme.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{theme.description}</p>

            {/* Best For Tags */}
            <div className="flex flex-wrap gap-2">
                {theme.bestFor?.slice(0, 2).map((tag, index) => (
                    <span
                        key={index}
                        className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
