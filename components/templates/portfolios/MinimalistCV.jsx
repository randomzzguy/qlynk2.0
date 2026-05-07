'use client';

import { motion } from 'framer-motion';
import { Download, Mail, ExternalLink } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * MinimalistCV Theme - Portfolio Category
 * Purpose: UX/UI designers & developers who value elegance and whitespace
 * Aesthetic: Swiss design - strict grid, monochrome + 1 accent, typographic hierarchy
 * Color Palette: Almost Black (#171717) with Red accent on light gray
 */
export default function MinimalistCV({ data }) {
    const colors = themeColors.minimalistcv;

    const mockData = {
        name: data?.name || "Alex Chen",
        role: data?.role || "Product Designer",
        headline: data?.headline || "Crafting intuitive digital experiences with precision and purpose",
        featuredProject: data?.featuredProject || {
            title: "Banking App Redesign",
            link: "#",
            image: "💳",
            desc: "Simplified complex financial workflows for 2M+ users"
        },
        skills: data?.skills || [
            { name: "UI Design", proficiency: 95 },
            { name: "Prototyping", proficiency: 90 },
            { name: "User Research", proficiency: 85 },
            { name: "Design Systems", proficiency: 90 },
            { name: "Frontend Dev", proficiency: 75 }
        ],
        experience: data?.experience || [
            { company: "TechCorp", role: "Senior Product Designer", dates: "2021 - Present", bullets: ["Led design for flagship product", "Managed team of 4 designers"] },
            { company: "StartupXYZ", role: "Product Designer", dates: "2019 - 2021", bullets: ["0-1 product design", "Established design system"] }
        ],
        education: data?.education || [
            { school: "Design University", degree: "BFA in Interaction Design", year: "2019" }
        ],
        email: data?.email || "alex@example.com",
        resumeUrl: data?.resumeUrl || "#",
        featuredProjectTitle: data?.featuredProjectTitle || "Featured Work",
        skillsTitle: data?.skillsTitle || "Skills",
        experienceTitle: data?.experienceTitle || "Experience",
        educationTitle: data?.educationTitle || "Education",
        downloadResumeText: data?.downloadResumeText || "Download CV"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header - Name & Role */}
            <header className="py-16 px-6 border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
                            {mockData.name}
                        </h1>
                        <p className="text-2xl md:text-3xl font-light" style={{ color: colors.textLight }}>
                            {mockData.role}
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* Headline */}
            <section className="py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.p
                        className="text-xl md:text-2xl leading-relaxed"
                        style={{ color: colors.textLight }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {mockData.headline}
                    </motion.p>
                </div>
            </section>

            {/* Featured Project */}
            <section className="py-16 px-6 border-t border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-8" style={{ color: colors.textLight }}>
                            {mockData.featuredProjectTitle}
                        </h2>

                        <a href={mockData.featuredProject.link}
                            className="block group"
                            target="_blank"
                            rel="noopener noreferrer">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="aspect-[4/3] flex items-center justify-center text-9xl" style={{ backgroundColor: colors.bgAlt }}>
                                    {mockData.featuredProject.image}
                                </div>

                                <div>
                                    <h3 className="text-4xl font-bold mb-4 group-hover:text-opacity-70 transition-opacity">
                                        {mockData.featuredProject.title}
                                    </h3>
                                    <p className="text-xl mb-6" style={{ color: colors.textLight }}>
                                        {mockData.featuredProject.desc}
                                    </p>
                                    <div className="flex items-center gap-2 font-bold" style={{ color: colors.accent }}>
                                        View Project
                                        <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Skills */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-8" style={{ color: colors.textLight }}>
                        {mockData.skillsTitle}
                    </h2>

                    <div className="space-y-6">
                        {mockData.skills.map((skill, index) => (
                            <motion.div
                                key={skill.name}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                            >
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold">{skill.name}</span>
                                    <span className="font-mono text-sm" style={{ color: colors.textLight }}>
                                        {skill.proficiency}%
                                    </span>
                                </div>
                                <div className="h-1" style={{ backgroundColor: colors.border }}>
                                    <motion.div
                                        className="h-full"
                                        style={{ backgroundColor: colors.accent }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${skill.proficiency}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, delay: index * 0.05 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Experience */}
            <section className="py-16 px-6 border-t" style={{ borderColor: colors.border }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-12" style={{ color: colors.textLight }}>
                        {mockData.experienceTitle}
                    </h2>

                    <div className="space-y-12">
                        {mockData.experience.map((exp, index) => (
                            <motion.div
                                key={index}
                                className="relative pl-8 border-l-2"
                                style={{ borderColor: index === 0 ? colors.accent : colors.border }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full"
                                    style={{ backgroundColor: index === 0 ? colors.accent : colors.border }} />

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="font-mono text-sm mb-2" style={{ color: colors.textLight }}>
                                            {exp.dates}
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <h3 className="text-2xl font-bold mb-2">{exp.role}</h3>
                                        <p className="font-bold mb-4" style={{ color: colors.textLight }}>
                                            {exp.company}
                                        </p>
                                        <ul className="space-y-2">
                                            {exp.bullets.map((bullet, i) => (
                                                <li key={i} className="flex gap-3">
                                                    <span style={{ color: colors.accent }}>—</span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Education */}
            <section className="py-16 px-6 border-t" style={{ borderColor: colors.border }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-8" style={{ color: colors.textLight }}>
                        {mockData.educationTitle}
                    </h2>

                    {mockData.education.map((edu, index) => (
                        <div key={index} className="grid md:grid-cols-3 gap-6">
                            <p className="font-mono text-sm" style={{ color: colors.textLight }}>
                                {edu.year}
                            </p>
                            <div className="md:col-span-2">
                                <p className="font-bold mb-1">{edu.degree}</p>
                                <p style={{ color: colors.textLight }}>{edu.school}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact */}
            <section className="py-16 px-6 border-t" style={{ borderColor: colors.border }}>
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
                    <a
                        href={`mailto:${mockData.email}`}
                        className="flex-1 px-8 py-4 text-center font-bold transition-all"
                        style={{ backgroundColor: colors.primary, color: colors.bg }}
                    >
                        <Mail size={20} className="inline mr-2" />
                        {mockData.email}
                    </a>
                    <a
                        href={mockData.resumeUrl}
                        className="flex-1 px-8 py-4 text-center font-bold border-2 transition-all"
                        style={{ borderColor: colors.primary, color: colors.primary }}
                    >
                        <Download size={20} className="inline mr-2" />
                        {mockData.downloadResumeText}
                    </a>
                </div>
            </section>
        </div>
    );
}
