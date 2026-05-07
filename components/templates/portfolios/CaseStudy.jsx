'use client';

import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * CaseStudy Theme - Portfolio Category
 * Purpose: Designers/developers highlighting process + impact
 * Aesthetic: Clean, editorial, timeline-based sections, accent dividers
 * Color Palette: Indigo (#4f46e5) with Sky Blue accents on white
 */
export default function CaseStudy({ data }) {
    const [activeChapter, setActiveChapter] = useState(0);
    const colors = themeColors.casestudy;

    const mockData = {
        name: data?.name || "Case Studies",
        intro: data?.intro || "Product designer crafting experiences that drive business results",
        caseStudies: data?.caseStudies || [
            {
                title: "E-Commerce Redesign",
                heroImage: "🛍️",
                challenge: "Online sales were declining despite increased traffic. The checkout process had a 68% abandonment rate.",
                process: "Conducted user interviews, analyzed heatmaps, and identified 3 major friction points in the checkout flow. Redesigned the entire purchase journey with a focus on trust signals and progress indication.",
                solution: "Implemented a streamlined 3-step checkout, added guest checkout option, and integrated real-time shipping calculations.",
                results: [
                    { metric: "Conversion Rate", value: "+127%" },
                    { metric: "Cart Abandonment", value: "-45%" },
                    { metric: "Revenue", value: "+$2.4M annually" }
                ]
            }
        ],
        tools: data?.tools || ["Figma", "React", "TypeScript", "Analytics"],
        email: data?.email || "design@example.com",
        toolsTitle: data?.toolsTitle || "Tools & Technologies",
        ctaTitle: data?.ctaTitle || "Like what you see?",
        ctaButtonText: data?.ctaButtonText || "Start a Project"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header */}
            <header className="py-8 px-6 border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">{mockData.name}</h1>
                    <a href={`mailto:${mockData.email}`}
                        className="px-6 py-2 rounded-lg font-bold transition-all"
                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                        Work Together
                    </a>
                </div>
            </header>

            {/* Intro */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.p
                        className="text-3xl md:text-4xl font-bold leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {mockData.intro}
                    </motion.p>
                </div>
            </section>

            {/* Case Studies */}
            {mockData.caseStudies.map((study, studyIndex) => (
                <article key={studyIndex} className="mb-20">
                    {/* Hero */}
                    <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                        <div className="max-w-5xl mx-auto">
                            <motion.div
                                className="text-center mb-12"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="text-8xl mb-8">{study.heroImage}</div>
                                <h2 className="text-4xl md:text-6xl font-black">{study.title}</h2>
                            </motion.div>
                        </div>
                    </section>

                    {/* Sticky Chapter Nav */}
                    <nav className="sticky top-0 z-40 py-4 px-6 border-b"
                        style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                        <div className="max-w-5xl mx-auto flex gap-6 overflow-x-auto">
                            {['Challenge', 'Process', 'Solution', 'Results'].map((chapter, i) => (
                                <button
                                    key={chapter}
                                    onClick={() => setActiveChapter(i)}
                                    className="px-4 py-2 font-bold whitespace-nowrap transition-all"
                                    style={{
                                        color: activeChapter === i ? colors.primary : colors.textLight,
                                        borderBottom: activeChapter === i ? `2px solid ${colors.primary}` : 'none'
                                    }}
                                >
                                    {chapter}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
                        {/* Challenge */}
                        <motion.section
                            id="challenge"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="w-12 h-1 mb-6" style={{ backgroundColor: colors.primary }} />
                            <h3 className="text-3xl font-bold mb-6">The Challenge</h3>
                            <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                                {study.challenge}
                            </p>
                        </motion.section>

                        {/* Process */}
                        <motion.section
                            id="process"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="w-12 h-1 mb-6" style={{ backgroundColor: colors.secondary }} />
                            <h3 className="text-3xl font-bold mb-6">The Process</h3>
                            <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                                {study.process}
                            </p>
                        </motion.section>

                        {/* Solution */}
                        <motion.section
                            id="solution"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="w-12 h-1 mb-6" style={{ backgroundColor: colors.accent }} />
                            <h3 className="text-3xl font-bold mb-6">The Solution</h3>
                            <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                                {study.solution}
                            </p>
                        </motion.section>

                        {/* Results */}
                        <motion.section
                            id="results"
                            className="p-12 rounded-2xl"
                            style={{ backgroundColor: colors.bgAlt }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <TrendingUp size={32} style={{ color: colors.accent }} />
                                <h3 className="text-3xl font-bold">The Results</h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                {study.results.map((result, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-5xl font-black mb-2" style={{ color: colors.primary }}>
                                            {result.value}
                                        </div>
                                        <div className="font-bold" style={{ color: colors.textLight }}>
                                            {result.metric}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    </div>
                </article>
            ))}

            {/* Tools Used */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-5xl mx-auto">
                    <h3 className="text-2xl font-bold mb-8 text-center">{mockData.toolsTitle}</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {mockData.tools.map((tool, i) => (
                            <div
                                key={i}
                                className="px-6 py-3 rounded-lg font-bold whitespace-nowrap"
                                style={{ backgroundColor: colors.bg, color: colors.primary }}
                            >
                                {tool}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-4xl font-bold mb-6">{mockData.ctaTitle}</h3>
                    <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                        Let&apos;s discuss how I can help drive results for your product
                    </p>
                    <a
                        href={`mailto:${mockData.email}`}
                        className="inline-flex items-center gap-2 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                    >
                        {mockData.ctaButtonText}
                        <ArrowRight size={24} />
                    </a>
                </div>
            </section>
        </div>
    );
}
