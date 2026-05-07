'use client';

import { motion } from 'framer-motion';
import { Code, Download, Github, Linkedin, Mail } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * SkillStack Theme - Freelancer Category
 * Purpose: Tech/creative freelancers highlighting tools, frameworks, and certifications
 * Aesthetic: Developer-friendly, monospace touches, badge-style skill tags, dark mode
 * Color Palette: Emerald Green (#10b981) with Cyan accents on dark background
 */
export default function SkillStack({ data }) {
    const [selectedTech, setSelectedTech] = useState('all');
    const colors = themeColors.skillstack;

    const mockData = {
        name: data?.name || "Jane Doe",
        bio: data?.bio || "Full-stack developer specializing in React, Node.js, and cloud architecture. 5+ years building scalable web applications.",
        skills: data?.skills || [
            { name: "React", level: 95 },
            { name: "TypeScript", level: 90 },
            { name: "Node.js", level: 85 },
            { name: "Python", level: 80 },
            { name: "AWS", level: 75 },
            { name: "Docker", level: 85 }
        ],
        projects: data?.projects || [
            {
                title: "E-Commerce Platform",
                desc: "Built a full-stack marketplace with 10K+ active users",
                image: null,
                tech: ["React", "Node.js", "PostgreSQL", "AWS"]
            },
            {
                title: "Analytics Dashboard",
                desc: "Real-time data visualization for enterprise clients",
                image: null,
                tech: ["TypeScript", "D3.js", "Python", "Redis"]
            },
            {
                title: "Mobile App Backend",
                desc: "Scalable API serving 1M+ requests/day",
                image: null,
                tech: ["Node.js", "MongoDB", "Docker", "AWS"]
            }
        ],
        resumeUrl: data?.resumeUrl || "#",
        email: data?.email || "dev@example.com",
        github: data?.github || "https://github.com/username",
        linkedin: data?.linkedin || "https://linkedin.com/in/username",
        skillsTitle: data?.skillsTitle || "Tech Stack",
        projectsTitle: data?.projectsTitle || "Projects",
        resumeButtonText: data?.resumeButtonText || "Download Resume"
    };

    const allTech = [...new Set(mockData.projects.flatMap(p => p.tech))];
    const filteredProjects = selectedTech === 'all'
        ? mockData.projects
        : mockData.projects.filter(p => p.tech.includes(selectedTech));

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header */}
            <header className="border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Code size={24} style={{ color: colors.primary }} />
                        <span className="font-mono font-bold text-lg">{data?.name || "DevPortfolio"}</span>
                    </div>
                    <div className="flex gap-4">
                        <a href={mockData.github} target="_blank" rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity">
                            <Github size={20} />
                        </a>
                        <a href={mockData.linkedin} target="_blank" rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity">
                            <Linkedin size={20} />
                        </a>
                    </div>
                </div>
            </header>

            {/* Bio Section */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="max-w-3xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-block px-3 py-1 rounded mb-4 font-mono text-sm"
                            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                            &lt;developer /&gt;
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Building the web, one commit at a time
                        </h1>
                        <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                            {mockData.bio}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Skills Section */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12">{mockData.skillsTitle}</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {mockData.skills.map((skill, index) => (
                            <motion.div
                                key={skill.name}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex justify-between mb-2">
                                    <span className="font-mono font-semibold">{skill.name}</span>
                                    <span className="font-mono text-sm" style={{ color: colors.textLight }}>
                                        {skill.level}%
                                    </span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: colors.primary }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${skill.level}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                        <h2 className="text-3xl font-bold">{mockData.projectsTitle}</h2>

                        {/* Tech Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedTech('all')}
                                className="px-4 py-2 rounded font-mono text-sm transition-all"
                                style={{
                                    backgroundColor: selectedTech === 'all' ? colors.primary : colors.bgAlt,
                                    color: selectedTech === 'all' ? colors.bg : colors.text
                                }}
                            >
                                All
                            </button>
                            {allTech.map(tech => (
                                <button
                                    key={tech}
                                    onClick={() => setSelectedTech(tech)}
                                    className="px-4 py-2 rounded font-mono text-sm transition-all"
                                    style={{
                                        backgroundColor: selectedTech === tech ? colors.primary : colors.bgAlt,
                                        color: selectedTech === tech ? colors.bg : colors.text
                                    }}
                                >
                                    {tech}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={project.title}
                                className="border rounded-lg p-6 hover:border-opacity-100 transition-all"
                                style={{
                                    borderColor: colors.border,
                                    backgroundColor: colors.bgAlt
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                                <p className="mb-4" style={{ color: colors.textLight }}>
                                    {project.desc}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {project.tech.map(tech => (
                                        <span
                                            key={tech}
                                            className="px-2 py-1 rounded text-xs font-mono"
                                            style={{
                                                backgroundColor: `${colors.secondary}20`,
                                                color: colors.secondary
                                            }}
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Resume & Contact */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-8">Let&apos;s Connect</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={mockData.resumeUrl}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold transition-all"
                            style={{
                                backgroundColor: colors.primary,
                                color: colors.bg
                            }}
                        >
                            <Download size={20} />
                            {mockData.resumeButtonText}
                        </a>
                        <a
                            href={`mailto:${mockData.email}`}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold border-2 transition-all"
                            style={{
                                borderColor: colors.primary,
                                color: colors.primary
                            }}
                        >
                            <Mail size={20} />
                            Get In Touch
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t" style={{ borderColor: colors.border }}>
                <div className="max-w-6xl mx-auto text-center">
                    <p className="font-mono text-sm" style={{ color: colors.textLight }}>
                        Built with React + Next.js • © 2024
                    </p>
                </div>
            </footer>
        </div>
    );
}
