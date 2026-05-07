'use client';

import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * LegacyCo Theme - Business Category
 * Purpose: Established businesses emphasizing heritage and longevity
 * Aesthetic: Classic, timeless design - timeline, founder story, awards
 * Color Palette: Brown (#78350f) with Amber/Red accents on cream/yellow
 */
export default function LegacyCo({ data }) {
    const colors = themeColors.legacyco;

    const mockData = {
        companyName: data?.name || "Heritage Craftworks",
        founded: data?.founded || "1952",
        tagline: data?.tagline || "Three generations of excellence in traditional craftsmanship",
        timeline: data?.timeline || [
            { year: "1952", event: "Founded by Master Craftsman John Smith" },
            { year: "1978", event: "Expanded to national distribution" },
            { year: "1995", event: "Second generation takes the helm" },
            { year: "2020", event: "Third generation continues the tradition" }
        ],
        values: data?.values || [
            { title: "Quality First", desc: "Every piece handcrafted to perfection" },
            { title: "Time-Honored Techniques", desc: "Traditional methods passed down through generations" },
            { title: "Customer Relationships", desc: "Many clients have been with us for decades" }
        ],
        awards: data?.awards || ["🏆", "🥇", "⭐", "🎖️"],
        timelineTitle: data?.timelineTitle || "Our Journey",
        valuesTitle: data?.valuesTitle || "Our Values",
        awardsTitle: data?.awardsTitle || "Recognition & Awards"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-block px-6 py-3 rounded-full mb-8 font-bold"
                            style={{ backgroundColor: colors.bgAlt, color: colors.primary }}>
                            <Clock size={20} className="inline mr-2" />
                            Est. {mockData.founded}
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black mb-6">
                            {mockData.companyName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        <a
                            href="#contact"
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            Discover Our Story
                            <ArrowRight size={24} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.timelineTitle}
                    </h2>

                    <div className="space-y-8">
                        {mockData.timeline.map((item, index) => (
                            <motion.div
                                key={index}
                                className="relative pl-12 border-l-4"
                                style={{ borderColor: colors.primary }}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full"
                                    style={{ backgroundColor: colors.primary }} />

                                <div className="pb-8">
                                    <div className="text-3xl font-black mb-2" style={{ color: colors.primary }}>
                                        {item.year}
                                    </div>
                                    <p className="text-xl">{item.event}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.valuesTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.values.map((value, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl text-center"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <h3 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>
                                    {value.title}
                                </h3>
                                <p style={{ color: colors.textLight }}>{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Awards */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-12">
                        {mockData.awardsTitle}
                    </h2>

                    <div className="flex justify-center gap-8">
                        {mockData.awards.map((award, index) => (
                            <motion.div
                                key={index}
                                className="text-7xl"
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                {award}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="contact" className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Experience the Difference
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        {parseInt(new Date().getFullYear()) - parseInt(mockData.founded)}+ years of trusted craftsmanship
                    </p>
                    <a
                        href="mailto:contact@heritage.com"
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: '#ffffff', color: colors.primary }}
                    >
                        <Users size={28} />
                        Contact Us Today
                    </a>
                </div>
            </section>
        </div>
    );
}
