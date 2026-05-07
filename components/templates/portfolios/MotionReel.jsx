'use client';

import { motion } from 'framer-motion';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * MotionReel Theme - Portfolio Category
 * Purpose: Video editors, animators, motion designers
 * Aesthetic: Dark mode, embedded video players, autoplay previews on hover, cinematic tone
 * Color Palette: Purple (#a855f7) with Pink accents on dark background
 */
export default function MotionReel({ data }) {
    const [muted, setMuted] = useState(true);
    const colors = themeColors.motionreel;

    const mockData = {
        name: data?.name || "Motion Designer",
        heroReel: data?.heroReel || { url: "#", poster: "🎬" },
        projects: data?.projects || [
            { title: "Brand Commercial", thumbnail: "📺", videoUrl: "#", duration: "0:30" },
            { title: "Product Launch", thumbnail: "🚀", videoUrl: "#", duration: "1:15" },
            { title: "Social Campaign", thumbnail: "📱", videoUrl: "#", duration: "0:45" },
            { title: "Event Recap", thumbnail: "🎉", videoUrl: "#", duration: "2:00" }
        ],
        bts: data?.bts || [
            { caption: "Behind the scenes of our latest shoot", media: "🎥" },
            { caption: "Color grading workflow", media: "🎨" }
        ],
        email: data?.email || "motion@example.com",
        projectsTitle: data?.projectsTitle || "Selected Work",
        btsTitle: data?.btsTitle || "Behind the Scenes",
        ctaTitle: data?.ctaTitle || "Let's Create Something Amazing",
        ctaButtonText: data?.ctaButtonText || "Get In Touch",
        heroSubtitle: data?.heroSubtitle || "Bringing brands to life through motion"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero Reel - Auto-loop */}
            <section className="relative h-screen">
                <div className="absolute inset-0 flex items-center justify-center text-9xl">
                    {mockData.heroReel.poster}
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-4">
                            {mockData.name}
                        </h1>
                        <p className="text-2xl mb-8" style={{ color: colors.textLight }}>
                            {mockData.heroSubtitle}
                        </p>

                        <button
                            onClick={() => setMuted(!muted)}
                            className="px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                            style={{ backgroundColor: colors.primary }}
                        >
                            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            {muted ? 'Unmute' : 'Mute'}
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Projects Grid - Play on Hover */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black mb-12">{mockData.projectsTitle}</h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {mockData.projects.map((project, index) => (
                            <motion.div
                                key={index}
                                className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Video Thumbnail */}
                                <div className="absolute inset-0 flex items-center justify-center text-8xl">
                                    {project.thumbnail}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm" style={{ color: colors.textLight }}>
                                            {project.duration}
                                        </span>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: colors.primary }}>
                                            <Play size={20} fill="currentColor" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Behind the Scenes */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black mb-12">{mockData.btsTitle}</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {mockData.bts.map((item, index) => (
                            <motion.div
                                key={index}
                                className="rounded-xl overflow-hidden"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="aspect-video flex items-center justify-center text-7xl">
                                    {item.media}
                                </div>
                                <div className="p-6">
                                    <p className="text-lg">{item.caption}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-5xl font-black mb-6">
                            {mockData.ctaTitle}
                        </h2>
                        <p className="text-xl mb-12" style={{ color: colors.textLight }}>
                            Available for freelance projects and collaborations
                        </p>
                        <a
                            href={`mailto:${mockData.email}`}
                            className="inline-block px-12 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl"
                            style={{ backgroundColor: colors.primary }}
                        >
                            {mockData.ctaButtonText}
                        </a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
