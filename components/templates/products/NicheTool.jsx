'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * NicheTool Theme - Product Category
 * Purpose: Micro-SaaS or single-purpose utility - solve one problem well
 * Aesthetic: Playful, quirky, bold colors, simple demo embed, "does one thing perfectly" vibe
 * Color Palette: Cyan (#06b6d4) with Purple/Pink accents on yellow tint background
 */
export default function NicheTool({ data }) {
    const colors = themeColors.nichetool;

    const mockData = {
        toolName: data?.name || "TextTweaker",
        tagline: data?.tagline || "Transform boring text into engaging copy. Instantly.",
        demoEmbed: data?.demoEmbed || "✨",
        problem: data?.problem || "Writing engaging copy takes hours. Most tools are bloated with features you&apos;ll never use.",
        solution: data?.solution || "One simple tool. One clear purpose. Transform your text in seconds, not hours.",
        useCases: data?.useCases || [
            "Social media posts",
            "Email subject lines",
            "Product descriptions",
            "Ad copy"
        ],
        pricing: data?.pricing || {
            free: "10 transformations/day",
            pro: "$9/month - Unlimited"
        },
        ctaLink: data?.ctaLink || "#",
        useCasesTitle: data?.useCasesTitle || "Perfect For"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-block px-6 py-3 rounded-full mb-8 font-bold"
                            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                            <Zap size={20} className="inline mr-2" />
                            Does One Thing. Does It Perfectly.
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black mb-6">
                            {mockData.toolName}
                        </h1>

                        <p className="text-3xl md:text-4xl mb-16" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        {/* Demo Embed */}
                        <div className="max-w-3xl mx-auto p-12 rounded-3xl mb-12"
                            style={{ backgroundColor: colors.bgAlt }}>
                            <div className="aspect-video flex items-center justify-center text-9xl">
                                {mockData.demoEmbed}
                            </div>
                            <p className="mt-6 text-sm" style={{ color: colors.textLight }}>
                                Try it yourself → Type anything and watch the magic happen
                            </p>
                        </div>

                        <a
                            href={mockData.ctaLink}
                            className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            Start Tweaking Free
                            <ArrowRight size={28} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Problem/Solution */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="text-6xl mb-6">😫</div>
                            <h2 className="text-3xl font-black mb-4">The Problem</h2>
                            <p className="text-xl" style={{ color: colors.textLight }}>
                                {mockData.problem}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="text-6xl mb-6">🎉</div>
                            <h2 className="text-3xl font-black mb-4" style={{ color: colors.primary }}>
                                The Solution
                            </h2>
                            <p className="text-xl" style={{ color: colors.textLight }}>
                                {mockData.solution}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.useCasesTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mockData.useCases.map((useCase, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl text-center"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="text-5xl mb-4">✓</div>
                                <p className="text-lg font-bold">{useCase}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        Simple Pricing
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div
                            className="p-10 rounded-3xl border-2"
                            style={{ borderColor: colors.border }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h3 className="text-3xl font-black mb-4">Free</h3>
                            <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                                {mockData.pricing.free}
                            </p>
                            <button
                                className="w-full px-8 py-4 rounded-lg font-bold text-lg border-2 transition-all"
                                style={{ borderColor: colors.primary, color: colors.primary }}
                            >
                                Start Free
                            </button>
                        </motion.div>

                        <motion.div
                            className="p-10 rounded-3xl border-2 relative"
                            style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}10` }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="absolute -top-4 right-8 px-4 py-1 rounded-full text-sm font-bold"
                                style={{ backgroundColor: colors.secondary, color: '#ffffff' }}>
                                POPULAR
                            </div>
                            <h3 className="text-3xl font-black mb-4">Pro</h3>
                            <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                                {mockData.pricing.pro}
                            </p>
                            <button
                                className="w-full px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
                                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                            >
                                Go Pro
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-5xl md:text-6xl font-black mb-6">
                            Ready to Transform Your Text?
                        </h2>
                        <p className="text-2xl mb-12" style={{ color: colors.textLight }}>
                            Join 10,000+ users who&apos;ve already made the switch
                        </p>
                        <a
                            href={mockData.ctaLink}
                            className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            <Zap size={28} />
                            Try It Free Now
                        </a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
