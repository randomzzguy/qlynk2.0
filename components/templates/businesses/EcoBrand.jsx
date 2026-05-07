'use client';

import { motion } from 'framer-motion';
import { Leaf, Heart, ArrowRight } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * EcoBrand Theme - Business Category
 * Purpose: Mission-driven brands - sustainability, social impact, ethical products
 * Aesthetic: Earthy tones, impact metrics, storytelling, transparency
 * Color Palette: Forest Green (#15803d) with Lime/Yellow accents on light green
 */
export default function EcoBrand({ data }) {
    const colors = themeColors.ecobrand;

    const mockData = {
        brandName: data?.name || "EarthFirst Goods",
        mission: data?.mission || "Creating sustainable products that don't cost the Earth",
        impact: data?.impact || [
            { metric: "Trees Planted", value: "50,000+" },
            { metric: "Plastic Saved", value: "2M lbs" },
            { metric: "Carbon Offset", value: "500 tons" }
        ],
        values: data?.values || [
            { title: "100% Sustainable", desc: "All materials sourced from renewable resources" },
            { title: "Carbon Neutral", desc: "Every product shipped with carbon offset" },
            { title: "Fair Trade", desc: "Ethical wages and working conditions guaranteed" },
            { title: "Give Back", desc: "1% of revenue goes to environmental causes" }
        ],
        ctaLink: data?.ctaLink || "#",
        impactTitle: data?.impactTitle || "Our Impact So Far",
        valuesTitle: data?.valuesTitle || "Our Commitments"
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
                        <Leaf size={64} style={{ color: colors.primary }} className="mx-auto mb-8" />
                        <h1 className="text-6xl md:text-8xl font-black mb-6">
                            {mockData.brandName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12 max-w-3xl mx-auto" style={{ color: colors.textLight }}>
                            {mockData.mission}
                        </p>

                        <a
                            href={mockData.ctaLink}
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            Shop Sustainably
                            <ArrowRight size={24} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Impact Metrics */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.impactTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.impact.map((item, index) => (
                            <motion.div
                                key={index}
                                className="text-center p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="text-6xl font-black mb-4" style={{ color: colors.primary }}>
                                    {item.value}
                                </div>
                                <div className="text-xl font-bold">{item.metric}</div>
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

                    <div className="grid md:grid-cols-2 gap-8">
                        {mockData.values.map((value, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl border-2"
                                style={{ borderColor: colors.border, backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <Heart size={32} style={{ color: colors.primary }} className="shrink-0" />
                                    <div>
                                        <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                                        <p className="text-lg" style={{ color: colors.textLight }}>{value.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Join the Movement
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        Every purchase makes a difference for our planet
                    </p>
                    <a
                        href={mockData.ctaLink}
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: '#ffffff', color: colors.primary }}
                    >
                        <Leaf size={28} />
                        Shop Now
                    </a>
                </div>
            </section>
        </div>
    );
}
