'use client';

import { motion } from 'framer-motion';
import { BookOpen, Heart, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * StoryBuilder Theme - Freelancer Category
 * Purpose: Narrative-driven freelancers who sell via personal journey
 * Aesthetic: Magazine-style, serif fonts, staggered imagery, scroll-driven storytelling
 * Color Palette: Purple (#7c3aed) with Pink accents on warm white background
 */
export default function StoryBuilder({ data }) {
    const [expandedCase, setExpandedCase] = useState(null);
    const colors = themeColors.storybuilder;

    const mockData = {
        name: data?.name || "Sarah Jones",
        storyBlocks: data?.storyBlocks || [
            { type: 'text', content: "It started with a simple question: Why do most websites feel soulless?" },
            { type: 'text', content: "After 10 years in corporate design, I realized the answer. We&apos;d forgotten to tell stories. We&apos;d optimized for clicks, not connections." },
            { type: 'text', content: "So I left. Started fresh. And began helping businesses find their voice again." }
        ],
        manifesto: data?.manifesto || "Every brand has a story worth telling. My job isn&apos;t just to design—it&apos;s to listen, understand, and translate your journey into experiences that resonate.",
        caseSnippets: data?.caseSnippets || [
            {
                title: "From Startup to Industry Leader",
                before: "Generic website, 2% conversion",
                after: "Compelling narrative, 12% conversion, featured in Forbes"
            },
            {
                title: "Rebranding a Legacy Business",
                before: "Outdated image, declining sales",
                after: "Modern identity, 40% revenue increase in 6 months"
            }
        ],
        ctaText: data?.ctaText || "Start Your Story",
        ctaLink: data?.ctaLink || "mailto:story@example.com",
        caseSnippetsTitle: data?.caseSnippetsTitle || "Transformation Stories"
    };

    return (
        <div className="min-h-screen font-serif" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header */}
            <nav className="p-8 flex justify-between items-center relative z-10">
                <span className="text-lg font-bold tracking-widest uppercase border-b-2 pb-1" style={{ borderColor: colors.primary }}>
                    {mockData.name}
                </span>
            </nav>

            {/* Hero */}
            <section className="min-h-screen flex items-center justify-center px-6 py-20">
                <motion.div
                    className="max-w-4xl mx-auto text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <BookOpen size={48} style={{ color: colors.primary }} className="mx-auto mb-8" />
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                        Every Brand Has a Story Worth Telling
                    </h1>
                    <p className="text-2xl leading-relaxed" style={{ color: colors.textLight }}>
                        I help businesses discover and share theirs
                    </p>
                </motion.div>
            </section>

            {/* Origin Story */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto space-y-16">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-block px-4 py-2 rounded-full mb-8 text-sm font-sans font-bold"
                            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                            MY JOURNEY
                        </div>
                    </motion.div>

                    {mockData.storyBlocks.map((block, index) => (
                        <motion.div
                            key={index}
                            className="relative"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                        >
                            {block.type === 'text' && (
                                <p className="text-3xl md:text-4xl leading-relaxed" style={{
                                    color: index % 2 === 0 ? colors.text : colors.textLight
                                }}>
                                    {block.content}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Philosophy/Manifesto */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <Heart size={40} style={{ color: colors.secondary }} className="mx-auto mb-6" />
                        <h2 className="text-4xl md:text-5xl font-bold mb-8">My Philosophy</h2>
                        <p className="text-2xl leading-relaxed italic" style={{ color: colors.textLight }}>
                            &ldquo;{mockData.manifesto}&rdquo;
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Client Journey / Case Snippets */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
                        {mockData.caseSnippetsTitle}
                    </h2>

                    <div className="space-y-8">
                        {mockData.caseSnippets.map((caseItem, index) => (
                            <motion.div
                                key={index}
                                className="border-l-4 pl-8 py-6 cursor-pointer"
                                style={{ borderColor: colors.primary }}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                onClick={() => setExpandedCase(expandedCase === index ? null : index)}
                            >
                                <h3 className="text-2xl md:text-3xl font-bold mb-6">
                                    {caseItem.title}
                                </h3>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-sm font-sans font-bold mb-2 uppercase tracking-wide"
                                            style={{ color: colors.textLight }}>
                                            Before
                                        </div>
                                        <p className="text-xl">{caseItem.before}</p>
                                    </div>

                                    <div>
                                        <div className="text-sm font-sans font-bold mb-2 uppercase tracking-wide"
                                            style={{ color: colors.primary }}>
                                            After
                                        </div>
                                        <p className="text-xl font-bold" style={{ color: colors.primary }}>
                                            {caseItem.after}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Offerings CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: colors.bg }}>
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-bold mb-8">
                            Ready to Tell Your Story?
                        </h2>
                        <p className="text-2xl mb-12 opacity-90">
                            Let&apos;s craft a narrative that connects with your audience
                        </p>
                        <a
                            href={mockData.ctaLink}
                            className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-sans font-bold text-xl transition-all shadow-2xl"
                            style={{ backgroundColor: colors.bg, color: colors.primary }}
                        >
                            {mockData.ctaText}
                            <ArrowRight size={24} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 text-center">
                <p className="font-sans" style={{ color: colors.textLight }}>
                    Crafting narratives that matter • © 2024
                </p>
            </footer>
        </div>
    );
}
