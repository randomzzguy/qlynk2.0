'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useRef } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * NarrativeScroll Theme - Portfolio Category
 * Purpose: Multidisciplinary creatives telling cohesive personal/professional journey
 * Aesthetic: Long-scroll storytelling, parallax layers, chapter breaks, custom illustrations
 * Color Palette: Deep Blue (#0369a1) with Teal/Amber accents on light blue background
 */
function ChapterSection({ chapter, index, scrollYProgress, colors }) {
    const y = useTransform(
        scrollYProgress,
        [(index * 0.25), ((index + 1) * 0.25)],
        ['0%', '-20%']
    );

    return (
        <section
            className="min-h-screen flex items-center px-6 py-32 relative overflow-hidden"
            style={{ backgroundColor: index % 2 === 0 ? colors.bg : colors.bgAlt }}
        >
            {/* Chapter Background */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center text-9xl opacity-5"
                style={{ y }}
            >
                {chapter.bgImage}
            </motion.div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Chapter Number */}
                    <div className="text-8xl font-black mb-6 opacity-20">
                        {(index + 1).toString().padStart(2, '0')}
                    </div>

                    {/* Chapter Title */}
                    <h2 className="text-5xl md:text-7xl font-black mb-8" style={{ color: colors.primary }}>
                        {chapter.title}
                    </h2>

                    {/* Chapter Body */}
                    <p className="text-2xl md:text-3xl leading-relaxed" style={{ color: colors.textLight }}>
                        {chapter.body}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

export default function NarrativeScroll({ data }) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef });
    const colors = themeColors.narrativescroll;

    const mockData = {
        name: data?.name || "A Journey Through Design",
        chapters: data?.chapters || [
            {
                title: "Learning",
                body: "It began in a small design studio, where I learned that great work comes from curiosity, not just talent. Every project was a lesson. Every failure, a stepping stone.",
                bgImage: "🎓"
            },
            {
                title: "Building",
                body: "Years of experimentation led to a unique approach: blending traditional design principles with modern technology. I built tools, systems, and experiences that solved real problems.",
                bgImage: "🔨"
            },
            {
                title: "Launching",
                body: "Today, I help brands tell their stories through design. From startups to Fortune 500s, the mission remains the same: create work that matters.",
                bgImage: "🚀"
            }
        ],
        artifacts: data?.artifacts || [
            { title: "Award-Winning Campaign", link: "#" },
            { title: "Published Design System", link: "#" }
        ],
        epilogue: data?.epilogue || {
            text: "The journey continues. Every project is a new chapter, every client a new story to tell.",
            ctaText: "Write the Next Chapter Together",
            ctaLink: "mailto:story@example.com"
        },
        artifactsTitle: data?.artifactsTitle || "Notable Work"
    };

    return (
        <div ref={containerRef} className="relative" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Progress Indicator */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
                style={{
                    backgroundColor: colors.primary,
                    scaleX: scrollYProgress
                }}
            />

            {/* Prologue */}
            <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
                <motion.div
                    className="max-w-4xl mx-auto text-center relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
                        {mockData.name}
                    </h1>
                    <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                        From student to storyteller
                    </p>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ArrowDown size={40} style={{ color: colors.primary }} />
                    </motion.div>
                </motion.div>

                {/* Parallax Background Element */}
                <motion.div
                    className="absolute inset-0 opacity-10"
                    style={{
                        y: useTransform(scrollYProgress, [0, 0.3], ['0%', '50%'])
                    }}
                >
                    <div className="text-9xl text-center pt-32">✨</div>
                </motion.div>
            </section>

            {/* Chapters */}
            {mockData.chapters.map((chapter, index) => (
                <ChapterSection
                    key={index}
                    chapter={chapter}
                    index={index}
                    scrollYProgress={scrollYProgress}
                    colors={colors}
                />
            ))}

            {/* Artifacts Section */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-5xl mx-auto">
                    <motion.h2
                        className="text-4xl font-black mb-16 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {mockData.artifactsTitle}
                    </motion.h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {mockData.artifacts.map((artifact, index) => (
                            <motion.a
                                key={index}
                                href={artifact.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group p-8 rounded-2xl border-2 transition-all"
                                style={{
                                    borderColor: colors.border,
                                    backgroundColor: colors.bg
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{
                                    borderColor: colors.primary,
                                    y: -5
                                }}
                            >
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-opacity-70 transition-opacity">
                                    {artifact.title}
                                </h3>
                                <div className="flex items-center gap-2 font-bold" style={{ color: colors.primary }}>
                                    View Project →
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Epilogue + CTA */}
            <section className="min-h-screen flex items-center justify-center px-6 py-32 relative overflow-hidden"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-3xl md:text-4xl font-bold leading-relaxed mb-12 italic">
                            &quot;{mockData.epilogue.text}&quot;
                        </p>

                        <a
                            href={mockData.epilogue.ctaLink}
                            className="inline-block px-12 py-6 rounded-lg font-black text-2xl transition-all shadow-2xl"
                            style={{ backgroundColor: '#ffffff', color: colors.primary }}
                        >
                            {mockData.epilogue.ctaText}
                        </a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
