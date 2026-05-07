'use client';

import { motion } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * GalleryGrid Theme - Portfolio Category
 * Purpose: Visual-first for photographers, illustrators, digital artists
 * Aesthetic: Masonry grid, full-bleed layout, minimal text overlay, dark bg for image focus
 * Color Palette: Teal (#0891b2) on very dark background
 */
export default function GalleryGrid({ data }) {
    const [selectedTag, setSelectedTag] = useState('all');
    const [lightboxImage, setLightboxImage] = useState(null);
    const colors = themeColors.gallerygrid;

    const mockData = {
        name: data?.name || "Portfolio",
        intro: data?.intro || "Visual storyteller capturing moments that matter",
        projects: data?.projects || [
            { title: "Urban Landscapes", category: "Photography", tags: ["photography", "urban"], featured: "🏙️" },
            { title: "Brand Identity", category: "Design", tags: ["design", "branding"], featured: "🎨" },
            { title: "Portrait Series", category: "Photography", tags: ["photography", "portrait"], featured: "📸" },
            { title: "Digital Art", category: "Illustration", tags: ["illustration", "digital"], featured: "✨" },
            { title: "Product Shots", category: "Photography", tags: ["photography", "product"], featured: "📦" },
            { title: "Abstract Works", category: "Illustration", tags: ["illustration", "abstract"], featured: "🌈" }
        ],
        about: data?.about || "Award-winning visual artist with 10+ years of experience. Featured in Vogue, National Geographic, and Creative Review.",
        email: data?.email || "hello@gallery.com",
        instagram: data?.instagram || "@username",
        aboutTitle: data?.aboutTitle || "About",
        contactButtonText: data?.contactButtonText || "Contact"
    };

    const allTags = ['all', ...new Set(mockData.projects.flatMap(p => p.tags))];
    const filteredProjects = selectedTag === 'all'
        ? mockData.projects
        : mockData.projects.filter(p => p.tags.includes(selectedTag));

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Minimal Header */}
            <header className="py-8 px-6 border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{mockData.name}</h1>
                    <a href={`mailto:${mockData.email}`}
                        className="px-6 py-2 rounded-lg font-bold transition-all"
                        style={{ backgroundColor: colors.primary, color: colors.bg }}>
                        {mockData.contactButtonText}
                    </a>
                </div>
            </header>

            {/* Optional Short Intro */}
            {mockData.intro && (
                <section className="py-12 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.p
                            className="text-2xl md:text-3xl"
                            style={{ color: colors.textLight }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {mockData.intro}
                        </motion.p>
                    </div>
                </section>
            )}

            {/* Filter Tags */}
            <section className="py-6 px-6 sticky top-0 z-40" style={{ backgroundColor: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter size={20} style={{ color: colors.textLight }} className="shrink-0" />
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className="px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap"
                                style={{
                                    backgroundColor: selectedTag === tag ? colors.primary : colors.bgAlt,
                                    color: selectedTag === tag ? colors.bg : colors.text
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Masonry Grid */}
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={index}
                                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-lg"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                onClick={() => setLightboxImage(project)}
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Image Placeholder */}
                                <div className="aspect-[4/5] flex items-center justify-center text-8xl">
                                    {project.featured}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                                    <p className="text-sm" style={{ color: colors.textLight }}>{project.category}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">{mockData.aboutTitle}</h2>
                    <p className="text-xl leading-relaxed mb-8" style={{ color: colors.textLight }}>
                        {mockData.about}
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href={`mailto:${mockData.email}`}
                            className="px-8 py-3 rounded-lg font-bold transition-all"
                            style={{ backgroundColor: colors.primary, color: colors.bg }}>
                            {mockData.email}
                        </a>
                        <a href={`https://instagram.com/${mockData.instagram.replace('@', '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="px-8 py-3 rounded-lg font-bold border-2 transition-all"
                            style={{ borderColor: colors.primary, color: colors.primary }}>
                            {mockData.instagram}
                        </a>
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-2 rounded-full transition-all"
                        style={{ backgroundColor: colors.primary }}
                        onClick={() => setLightboxImage(null)}
                    >
                        <X size={24} />
                    </button>

                    <div className="max-w-5xl w-full">
                        <div className="aspect-[4/3] flex items-center justify-center text-9xl mb-6">
                            {lightboxImage.featured}
                        </div>
                        <div className="text-center">
                            <h3 className="text-3xl font-bold mb-2">{lightboxImage.title}</h3>
                            <p style={{ color: colors.textLight }}>{lightboxImage.category}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
