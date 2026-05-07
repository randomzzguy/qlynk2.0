'use client';

import { motion } from 'framer-motion';
import { Share2, Check, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * LaunchPad Theme - Product Category
 * Purpose: Pre-launch or crowdfunding - build hype and capture emails
 * Aesthetic: Bold gradients, animated counters, social proof bars
 * Color Palette: Purple (#7c3aed) with Pink/Orange accents on light gray
 */
export default function LaunchPad({ data }) {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const colors = themeColors.launchpad;

    const mockData = {
        productName: data?.name || "NextGen App",
        tagline: data?.tagline || "The future of productivity is here",
        heroVideo: data?.heroVideo || "🚀",
        problem: data?.problem || "Traditional tools are slow, complicated, and expensive. Teams waste hours on tasks that should take minutes.",
        solution: data?.solution || "Our AI-powered platform automates repetitive work, integrates with your existing tools, and scales with your team.",
        waitlistCta: data?.waitlistCta || "Join the Waitlist",
        testimonials: data?.testimonials || [
            { quote: "This is exactly what we've been waiting for!", name: "Sarah Chen", role: "Product Manager" },
            { quote: "Game-changing technology. Can't wait for launch!", name: "Mike Rodriguez", role: "CTO" },
            { quote: "Finally, a solution that makes sense.", name: "Emma Thompson", role: "Founder" }
        ],
        faq: data?.faq || [
            { q: "When will it launch?", a: "We're launching in Q1 2026. Join the waitlist for early access!" },
            { q: "What's the pricing?", a: "Early adopters get 50% off for life. Regular pricing starts at $29/month." },
            { q: "Is there a free trial?", a: "Yes! All waitlist members get a 30-day free trial." }
        ],
        testimonialsTitle: data?.testimonialsTitle || "What Early Adopters Say",
        faqTitle: data?.faqTitle || "FAQ"
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubscribed(true);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero */}
            <section className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br opacity-10"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }} />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="text-9xl mb-8">{mockData.heroVideo}</div>

                        <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r bg-clip-text text-transparent"
                            style={{ backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}>
                            {mockData.productName}
                        </h1>

                        <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        {/* Waitlist Form */}
                        {!subscribed ? (
                            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className="flex-1 px-6 py-4 rounded-lg border-2 text-lg"
                                        style={{ borderColor: colors.border, backgroundColor: '#ffffff' }}
                                    />
                                    <button
                                        type="submit"
                                        className="px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
                                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                    >
                                        {mockData.waitlistCta}
                                    </button>
                                </div>
                                <p className="text-sm mt-4" style={{ color: colors.textLight }}>
                                    Join 5,000+ people waiting for launch
                                </p>
                            </form>
                        ) : (
                            <motion.div
                                className="max-w-md mx-auto p-8 rounded-2xl"
                                style={{ backgroundColor: `${colors.primary}20` }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Check size={48} style={{ color: colors.primary }} className="mx-auto mb-4" />
                                <h3 className="text-2xl font-bold mb-2">You&apos;re on the list!</h3>
                                <p style={{ color: colors.textLight }}>
                                    We&apos;ll notify you when we launch. Check your email for a special gift 🎁
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Problem/Solution */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-black mb-6">The Problem</h2>
                        <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                            {mockData.problem}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl font-black mb-6" style={{ color: colors.primary }}>
                            The Solution
                        </h2>
                        <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                            {mockData.solution}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.testimonialsTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <p className="text-lg mb-6 italic">&quot;{testimonial.quote}&quot;</p>
                                <div>
                                    <p className="font-bold">{testimonial.name}</p>
                                    <p className="text-sm" style={{ color: colors.textLight }}>
                                        {testimonial.role}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.faqTitle}
                    </h2>

                    <div className="space-y-6">
                        {mockData.faq.map((item, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-xl border-2"
                                style={{ borderColor: colors.border, backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <HelpCircle size={24} style={{ color: colors.primary }} className="shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-xl font-bold mb-3">{item.q}</h3>
                                        <p style={{ color: colors.textLight }}>{item.a}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-5xl font-black mb-6">
                        Don&apos;t Miss the Launch
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        Be the first to experience the future of productivity
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            className="px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl"
                            style={{ backgroundColor: '#ffffff', color: colors.primary }}
                        >
                            Join Waitlist
                        </button>
                        <button
                            className="px-10 py-5 rounded-lg font-bold text-xl border-2 border-white transition-all flex items-center gap-2"
                        >
                            <Share2 size={24} />
                            Share
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
