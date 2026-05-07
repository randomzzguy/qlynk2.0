'use client';

import { motion } from 'framer-motion';
import { Download, Check, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * DigitalDownload Theme - Product Category
 * Purpose: E-books, templates, presets, fonts - instant delivery
 * Aesthetic: Light, airy, "open box" feel - preview thumbnails, trust badges
 * Color Palette: Amber (#f59e0b) with Red/Purple accents on cream background
 */
export default function DigitalDownload({ data }) {
    const [previewPage, setPreviewPage] = useState(0);
    const colors = themeColors.digitaldownload;

    const mockData = {
        productName: data?.name || "Ultimate Design System",
        price: data?.price || "$49",
        previewItems: data?.previewItems || [
            "📄", "🎨", "📐", "🖼️", "📊", "✨"
        ],
        included: data?.included || [
            "200+ UI Components",
            "50+ Page Templates",
            "Figma & Sketch Files",
            "Complete Documentation",
            "Lifetime Updates",
            "Commercial License"
        ],
        testimonials: data?.testimonials || [
            { text: "Best $49 I've ever spent. Saved me weeks of work!", name: "Sarah M." },
            { text: "Professional quality, easy to customize. Highly recommend!", name: "Mike R." },
            { text: "The documentation alone is worth the price. Amazing value.", name: "Emma T." }
        ],
        buyLink: data?.buyLink || "#",
        includedTitle: data?.includedTitle || "What's Included",
        testimonialsTitle: data?.testimonialsTitle || "Loved by Designers"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-black mb-6">
                            {mockData.productName}
                        </h1>
                        <p className="text-2xl mb-8" style={{ color: colors.textLight }}>
                            Everything you need to build beautiful products, faster
                        </p>

                        <div className="flex items-baseline gap-4 mb-8">
                            <div className="text-6xl font-black" style={{ color: colors.primary }}>
                                {mockData.price}
                            </div>
                            <div style={{ color: colors.textLight }}>one-time payment</div>
                        </div>

                        <a
                            href={mockData.buyLink}
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            <CreditCard size={24} />
                            Buy Now - Instant Download
                        </a>

                        <div className="flex items-center gap-6 mt-6 text-sm" style={{ color: colors.textLight }}>
                            <div className="flex items-center gap-2">
                                <Check size={16} style={{ color: colors.secondary }} />
                                Secure Payment
                            </div>
                            <div className="flex items-center gap-2">
                                <Check size={16} style={{ color: colors.secondary }} />
                                30-Day Guarantee
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
                            style={{ backgroundColor: colors.bgAlt }}>
                            <div className="w-full h-full flex items-center justify-center text-9xl">
                                {mockData.previewItems[previewPage]}
                            </div>
                        </div>

                        {/* Preview Navigation */}
                        <div className="flex gap-2 mt-6 justify-center">
                            {mockData.previewItems.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setPreviewPage(index)}
                                    className="w-3 h-3 rounded-full transition-all"
                                    style={{
                                        backgroundColor: previewPage === index ? colors.primary : colors.border
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* What's Included */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.includedTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {mockData.included.map((item, index) => (
                            <motion.div
                                key={index}
                                className="flex items-start gap-4 p-6 rounded-xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                            >
                                <Check size={24} style={{ color: colors.primary }} className="shrink-0 mt-1" />
                                <span className="text-lg font-medium">{item}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.testimonialsTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <p className="text-lg mb-6 italic">&quot;{testimonial.text}&quot;</p>
                                <p className="font-bold">— {testimonial.name}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Start Building Today
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        Instant access. Download immediately after purchase.
                    </p>
                    <a
                        href={mockData.buyLink}
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: '#ffffff', color: colors.primary }}
                    >
                        <Download size={28} />
                        Get Instant Access - {mockData.price}
                    </a>
                    <p className="text-sm mt-6 opacity-75">
                        30-day money-back guarantee • Secure checkout
                    </p>
                </div>
            </section>
        </div>
    );
}
