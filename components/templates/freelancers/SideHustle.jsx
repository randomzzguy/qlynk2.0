'use client';

import { motion } from 'framer-motion';
import { Coffee, Sparkles, Mail, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * SideHustle Theme - Freelancer Category
 * Purpose: Part-time or moonlighting freelancers with casual, approachable vibe
 * Aesthetic: Playful colors, illustrations, emoji support, casual tone
 * Color Palette: Hot Pink (#ec4899) with Purple/Cyan accents on light purple background
 */
export default function SideHustle({ data }) {
    const [hoveredOffer, setHoveredOffer] = useState(null);
    const colors = themeColors.sidehustle;

    const mockData = {
        name: data?.name || "Side Hustle Studio",
        intro: data?.intro || "I design websites when I&apos;m not teaching yoga 🧘‍♀️",
        offers: data?.offers || [
            { title: "Website Design", emoji: "🎨", desc: "Beautiful sites that don&apos;t break the bank" },
            { title: "Logo Creation", emoji: "✨", desc: "Memorable branding for your side hustle" },
            { title: "Social Graphics", emoji: "📱", desc: "Eye-catching posts that get noticed" },
            { title: "Quick Fixes", emoji: "🔧", desc: "Website tweaks and updates, fast" }
        ],
        funFacts: data?.funFacts || [
            { label: "Coffee consumed", value: "327" },
            { label: "Happy clients", value: "42" },
            { label: "Late-night designs", value: "156" }
        ],
        socials: data?.socials || {
            instagram: "https://instagram.com/username",
            twitter: "https://twitter.com/username",
            linkedin: "https://linkedin.com/in/username"
        },
        email: data?.email || "hey@sidehustle.com",
        offersTitle: data?.offersTitle || "What I Can Help With",
        funFactsTitle: data?.funFactsTitle || "Fun Facts About This Side Hustle",
        socialsTitle: data?.socialsTitle || "Let&apos;s Chat!"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Fun Header */}
            <header className="py-6 px-6 border-b" style={{ borderColor: colors.border }}>
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles size={24} style={{ color: colors.primary }} />
                        <span className="font-bold text-lg">{mockData.name}</span>
                    </div>
                    <div className="flex gap-3">
                        <a href={mockData.socials.instagram} target="_blank" rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform">
                            <Instagram size={20} style={{ color: colors.primary }} />
                        </a>
                        <a href={mockData.socials.twitter} target="_blank" rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform">
                            <Twitter size={20} style={{ color: colors.secondary }} />
                        </a>
                        <a href={mockData.socials.linkedin} target="_blank" rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform">
                            <Linkedin size={20} style={{ color: colors.accent }} />
                        </a>
                    </div>
                </div>
            </header>

            {/* Intro Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-8xl mb-8">👋</div>
                        <h1 className="text-5xl md:text-6xl font-black mb-6">
                            Hey! I&apos;m Your Friendly Neighborhood Designer
                        </h1>
                        <p className="text-2xl md:text-3xl mb-8" style={{ color: colors.textLight }}>
                            {mockData.intro}
                        </p>
                        <p className="text-xl" style={{ color: colors.textLight }}>
                            Let&apos;s make something cool together (evenings & weekends work best!)
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* What I Offer - Icon Grid */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-12">
                        {mockData.offersTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mockData.offers.map((offer, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl text-center cursor-pointer transition-all"
                                style={{
                                    backgroundColor: colors.bg,
                                    transform: hoveredOffer === index ? 'scale(1.05)' : 'scale(1)'
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                onMouseEnter={() => setHoveredOffer(index)}
                                onMouseLeave={() => setHoveredOffer(null)}
                                whileHover={{ y: -10 }}
                            >
                                <motion.div
                                    className="text-6xl mb-4"
                                    animate={{
                                        rotate: hoveredOffer === index ? [0, -10, 10, -10, 0] : 0
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {offer.emoji}
                                </motion.div>
                                <h3 className="text-xl font-bold mb-3">{offer.title}</h3>
                                <p style={{ color: colors.textLight }}>{offer.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Fun Facts - Animated Stats */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-12">
                        {mockData.funFactsTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.funFacts.map((fact, index) => (
                            <motion.div
                                key={index}
                                className="text-center p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                    type: "spring"
                                }}
                            >
                                <motion.div
                                    className="text-6xl font-black mb-4"
                                    style={{ color: [colors.primary, colors.secondary, colors.accent][index % 3] }}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.8,
                                        delay: index * 0.1 + 0.3,
                                        type: "spring",
                                        bounce: 0.6
                                    }}
                                >
                                    {fact.value}
                                </motion.div>
                                <p className="text-lg font-bold">{fact.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact with Social DM Prompts */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Coffee size={48} className="mx-auto mb-6" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6">
                            {mockData.socialsTitle}
                        </h2>
                        <p className="text-xl mb-12 opacity-90">
                            Slide into my DMs or shoot me an email. I&apos;m pretty chill about how we connect 😊
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <a
                                href={`mailto:${mockData.email}`}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
                                style={{ backgroundColor: '#ffffff', color: colors.primary }}
                            >
                                <Mail size={20} />
                                Email Me
                            </a>
                            <a
                                href={mockData.socials.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg border-2 border-white transition-all"
                            >
                                <Instagram size={20} />
                                DM on Instagram
                            </a>
                        </div>

                        <p className="text-sm opacity-75">
                            Response time: Usually within 24 hours (unless I&apos;m on the yoga mat 🧘‍♀️)
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 text-center" style={{ backgroundColor: colors.bgAlt }}>
                <p style={{ color: colors.textLight }}>
                    Made with ❤️ during late nights and early mornings • © 2024
                </p>
            </footer>
        </div>
    );
}
