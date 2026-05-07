'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * FeatureFocus Theme - Product Category
 * Purpose: Product with 3-5 core features to highlight (SaaS, apps, tools)
 * Aesthetic: Clean SaaS - cards, icons, alternating bg colors, animated feature illustrations
 * Color Palette: Sky Blue (#0ea5e9) with Purple/Emerald accents on white/light blue
 */
export default function FeatureFocus({ data }) {
    const [selectedFeature, setSelectedFeature] = useState(0);
    const colors = themeColors.featurefocus;

    const mockData = {
        productName: data?.name || "CloudSync Pro",
        tagline: data?.tagline || "Seamless file synchronization across all your devices",
        features: data?.features || [
            {
                title: "Real-Time Sync",
                desc: "Files update instantly across all devices. No waiting, no manual uploads.",
                icon: "⚡",
                image: "☁️"
            },
            {
                title: "End-to-End Encryption",
                desc: "Your data is encrypted before it leaves your device. Only you have the keys.",
                icon: "🔒",
                image: "🛡️"
            },
            {
                title: "Version History",
                desc: "Access any previous version of your files. Restore or compare with ease.",
                icon: "⏰",
                image: "📚"
            },
            {
                title: "Team Collaboration",
                desc: "Share folders, set permissions, and work together in real-time.",
                icon: "👥",
                image: "🤝"
            }
        ],
        comparison: data?.comparison || {
            enabled: true,
            rows: [
                { feature: "Storage", self: "Unlimited", competitor: "100GB" },
                { feature: "Team Members", self: "Unlimited", competitor: "5 max" },
                { feature: "Version History", self: "Forever", competitor: "30 days" },
                { feature: "Support", self: "24/7", competitor: "Email only" }
            ]
        },
        ctaPrimary: data?.ctaPrimary || "Start Free Trial",
        ctaSecondary: data?.ctaSecondary || "View Pricing",
        featuresTitle: data?.featuresTitle || "Key Features",
        comparisonTitle: data?.comparisonTitle || "How We Compare"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            {mockData.productName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12 max-w-3xl mx-auto" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                            >
                                {mockData.ctaPrimary}
                            </button>
                            <button
                                className="px-10 py-5 rounded-lg font-bold text-xl border-2 transition-all"
                                style={{ borderColor: colors.primary, color: colors.primary }}
                            >
                                {mockData.ctaSecondary}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.featuresTitle}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {mockData.features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl cursor-pointer transition-all"
                                style={{
                                    backgroundColor: index % 2 === 0 ? colors.bgAlt : colors.bg,
                                    borderWidth: selectedFeature === index ? '2px' : '0px',
                                    borderColor: colors.primary
                                }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                onClick={() => setSelectedFeature(index)}
                                whileHover={{ y: -5 }}
                            >
                                <div className="text-6xl mb-6">{feature.icon}</div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p style={{ color: colors.textLight }}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Feature Detail */}
                    <motion.div
                        key={selectedFeature}
                        className="mt-16 p-12 rounded-3xl"
                        style={{ backgroundColor: colors.bgAlt }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-4xl font-black mb-6" style={{ color: colors.primary }}>
                                    {mockData.features[selectedFeature].title}
                                </h3>
                                <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                                    {mockData.features[selectedFeature].desc}
                                </p>
                            </div>
                            <div className="text-9xl text-center">
                                {mockData.features[selectedFeature].image}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Comparison Table */}
            {mockData.comparison.enabled && (
                <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl font-black text-center mb-16">
                            {mockData.comparisonTitle}
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2" style={{ borderColor: colors.border }}>
                                        <th className="text-left py-4 px-6 font-bold">Feature</th>
                                        <th className="text-center py-4 px-6 font-bold" style={{ color: colors.primary }}>
                                            {mockData.productName}
                                        </th>
                                        <th className="text-center py-4 px-6 font-bold" style={{ color: colors.textLight }}>
                                            Competitors
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockData.comparison.rows.map((row, index) => (
                                        <motion.tr
                                            key={index}
                                            className="border-b"
                                            style={{ borderColor: colors.border }}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.05 }}
                                        >
                                            <td className="py-4 px-6 font-medium">{row.feature}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold"
                                                    style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                                    <Check size={20} />
                                                    {row.self}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center" style={{ color: colors.textLight }}>
                                                {row.competitor}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-2xl mb-12" style={{ color: colors.textLight }}>
                        Join thousands of teams already using {mockData.productName}
                    </p>
                    <button
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                    >
                        {mockData.ctaPrimary}
                        <ArrowRight size={28} />
                    </button>
                    <p className="text-sm mt-6" style={{ color: colors.textLight }}>
                        No credit card required • 14-day free trial
                    </p>
                </div>
            </section>
        </div>
    );
}
