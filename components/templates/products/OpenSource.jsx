'use client';

import { motion } from 'framer-motion';
import { Github, Star, GitFork, Download, Code } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * OpenSource Theme - Product Category
 * Purpose: Developer tools, libraries, frameworks - community-driven
 * Aesthetic: GitHub-inspired dark mode, code snippets, contributor grid
 * Color Palette: Green (#22c55e) with Blue/Amber accents on dark background
 */
export default function OpenSource({ data }) {
    const colors = themeColors.opensource;

    const mockData = {
        projectName: data?.name || "react-awesome-ui",
        tagline: data?.tagline || "Beautiful, accessible React components for modern web apps",
        stats: data?.stats || [
            { label: "Stars", value: "12.5k", icon: Star },
            { label: "Forks", value: "1.2k", icon: GitFork },
            { label: "Downloads", value: "500k/mo", icon: Download }
        ],
        quickStart: data?.quickStart || "npm install react-awesome-ui",
        features: data?.features || [
            { title: "Fully Typed", desc: "100% TypeScript with complete type definitions" },
            { title: "Accessible", desc: "WCAG 2.1 AA compliant out of the box" },
            { title: "Customizable", desc: "Theme system with CSS variables" },
            { title: "Tree-shakeable", desc: "Import only what you need" }
        ],
        contributors: data?.contributors || ["👤", "👤", "👤", "👤", "👤", "👤"],
        githubUrl: data?.githubUrl || "https://github.com/username/repo",
        docsUrl: data?.docsUrl || "#",
        featuresTitle: data?.featuresTitle || "Features",
        contributorsTitle: data?.contributorsTitle || "Built by the Community"
    };

    return (
        <div className="min-h-screen font-mono" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header */}
            <header className="py-6 px-6 border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Code size={28} style={{ color: colors.primary }} />
                        <span className="text-xl font-bold">{mockData.projectName}</span>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={mockData.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all"
                            style={{ backgroundColor: colors.bgAlt, color: colors.text }}
                        >
                            <Github size={20} />
                            GitHub
                        </a>
                        <a
                            href={mockData.docsUrl}
                            className="px-6 py-2 rounded-lg font-bold transition-all"
                            style={{ backgroundColor: colors.primary, color: colors.bg }}
                        >
                            Documentation
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            {mockData.projectName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        {/* Stats */}
                        <div className="flex justify-center gap-8 mb-12">
                            {mockData.stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <stat.icon size={20} style={{ color: colors.primary }} />
                                        <span className="text-3xl font-black" style={{ color: colors.primary }}>
                                            {stat.value}
                                        </span>
                                    </div>
                                    <div className="text-sm" style={{ color: colors.textLight }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Start */}
                        <div className="max-w-2xl mx-auto p-6 rounded-xl border-2"
                            style={{ backgroundColor: colors.bgAlt, borderColor: colors.border }}>
                            <div className="flex items-center justify-between">
                                <code className="text-lg" style={{ color: colors.primary }}>
                                    {mockData.quickStart}
                                </code>
                                <button
                                    className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                    style={{ backgroundColor: colors.primary, color: colors.bg }}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center">{mockData.featuresTitle}</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {mockData.features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-xl border"
                                style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <h3 className="text-2xl font-bold mb-3" style={{ color: colors.primary }}>
                                    {feature.title}
                                </h3>
                                <p style={{ color: colors.textLight }}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contributors */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        {mockData.contributorsTitle}
                    </h2>

                    <div className="flex justify-center gap-4 mb-12">
                        {mockData.contributors.map((contributor, index) => (
                            <motion.div
                                key={index}
                                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                            >
                                {contributor}
                            </motion.div>
                        ))}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold"
                            style={{ backgroundColor: colors.primary, color: colors.bg }}>
                            +50
                        </div>
                    </div>

                    <p className="text-center text-xl" style={{ color: colors.textLight }}>
                        Join our community of contributors on GitHub
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: colors.bg }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Start Building Today
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        Free and open source. MIT licensed.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={mockData.docsUrl}
                            className="px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl"
                            style={{ backgroundColor: colors.bg, color: colors.primary }}
                        >
                            Read Documentation
                        </a>
                        <a
                            href={mockData.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-10 py-5 rounded-lg font-bold text-xl border-2 transition-all"
                            style={{ borderColor: colors.bg }}
                        >
                            <Github size={24} />
                            View on GitHub
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
