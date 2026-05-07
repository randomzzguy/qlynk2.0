'use client';

import { motion } from 'framer-motion';
import { Code2, Copy, Github, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * InteractiveDemo Theme - Portfolio Category
 * Purpose: Frontend devs, creative coders, WebGL artists
 * Aesthetic: Code-meets-art with embeddable demos, dark theme, console-style accents
 * Color Palette: Green (#22c55e) with Blue accents on dark brown background
 */
export default function InteractiveDemo({ data }) {
    const [copiedSnippet, setCopiedSnippet] = useState(null);
    const colors = themeColors.interactivedemo;

    const mockData = {
        name: data?.name || "Creative Coder",
        heroDemo: data?.heroDemo || { url: "#", title: "Interactive 3D Scene" },
        demos: data?.demos || [
            { title: "Particle System", embedUrl: "#", tech: ["Three.js", "WebGL"] },
            { title: "Data Visualization", embedUrl: "#", tech: ["D3.js", "Canvas"] },
            { title: "Generative Art", embedUrl: "#", tech: ["p5.js", "GLSL"] }
        ],
        snippets: data?.snippets || [
            { language: "javascript", code: "const scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);" },
            { language: "glsl", code: "void main() {\n  vec3 color = vec3(0.5 + 0.5 * sin(time));\n  gl_FragColor = vec4(color, 1.0);\n}" }
        ],
        githubUrl: data?.githubUrl || "https://github.com/username",
        demosTitle: data?.demosTitle || "Live Demos",
        snippetsTitle: data?.snippetsTitle || "Code Snippets",
        githubTitle: data?.githubTitle || "Explore More on GitHub",
        githubButtonText: data?.githubButtonText || "View GitHub Profile"
    };

    const copyToClipboard = (code, index) => {
        navigator.clipboard.writeText(code);
        setCopiedSnippet(index);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    return (
        <div className="min-h-screen font-mono" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header */}
            <header className="py-6 px-6 border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Code2 size={24} style={{ color: colors.primary }} />
                        <span className="font-bold">{mockData.name}</span>
                    </div>
                    <a href={mockData.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all"
                        style={{ backgroundColor: colors.primary, color: colors.bg }}>
                        <Github size={20} />
                        GitHub
                    </a>
                </div>
            </header>

            {/* Hero Interactive Demo */}
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="rounded-2xl overflow-hidden border-2"
                        style={{ borderColor: colors.border, backgroundColor: colors.bgAlt }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="aspect-video flex items-center justify-center text-9xl">
                            🎮
                        </div>
                        <div className="p-6 border-t" style={{ borderColor: colors.border }}>
                            <h2 className="text-2xl font-bold mb-2">{mockData.heroDemo.title}</h2>
                            <p style={{ color: colors.textLight }}>
                                Click and drag to interact • Built with Three.js
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Live Demos Grid */}
            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 flex items-center gap-3">
                        <span style={{ color: colors.primary }}>&gt;_</span>
                        {mockData.demosTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {mockData.demos.map((demo, index) => (
                            <motion.div
                                key={index}
                                className="rounded-xl overflow-hidden border"
                                style={{ borderColor: colors.border, backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="aspect-square flex items-center justify-center text-6xl">
                                    💻
                                </div>
                                <div className="p-6 border-t" style={{ borderColor: colors.border }}>
                                    <h3 className="text-xl font-bold mb-3">{demo.title}</h3>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {demo.tech.map((tech, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 rounded text-xs"
                                                style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                    <a
                                        href={demo.embedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 font-bold"
                                        style={{ color: colors.primary }}
                                    >
                                        View Demo
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Code Snippets */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 flex items-center gap-3">
                        <span style={{ color: colors.accent }}>{'{}'}</span>
                        {mockData.snippetsTitle}
                    </h2>

                    <div className="space-y-6">
                        {mockData.snippets.map((snippet, index) => (
                            <motion.div
                                key={index}
                                className="rounded-xl overflow-hidden border"
                                style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex items-center justify-between px-6 py-3 border-b"
                                    style={{ borderColor: colors.border }}>
                                    <span className="text-sm" style={{ color: colors.textLight }}>
                                        {snippet.language}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(snippet.code, index)}
                                        className="flex items-center gap-2 px-3 py-1 rounded text-sm font-bold transition-all"
                                        style={{
                                            backgroundColor: copiedSnippet === index ? colors.primary : 'transparent',
                                            color: copiedSnippet === index ? colors.bg : colors.primary
                                        }}
                                    >
                                        <Copy size={16} />
                                        {copiedSnippet === index ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="p-6 overflow-x-auto">
                                    <code style={{ color: colors.text }}>{snippet.code}</code>
                                </pre>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GitHub CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Github size={64} style={{ color: colors.primary }} className="mx-auto mb-6" />
                        <h2 className="text-4xl font-bold mb-6">
                            {mockData.githubTitle}
                        </h2>
                        <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                            Open source projects, experiments, and code samples
                        </p>
                        <a
                            href={mockData.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-10 py-4 rounded-lg font-bold text-lg transition-all"
                            style={{ backgroundColor: colors.primary, color: colors.bg }}
                        >
                            <Github size={24} />
                            {mockData.githubButtonText}
                        </a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
