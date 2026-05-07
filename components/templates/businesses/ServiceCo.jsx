'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Mail } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * ServiceCo Theme - Business Category
 * Purpose: B2B service providers - consulting, agencies, professional services
 * Aesthetic: Corporate but modern - trust signals, case study teasers, lead form
 * Color Palette: Blue (#1e40af) with Teal/Emerald accents on light gray
 */
export default function ServiceCo({ data }) {
    const colors = themeColors.serviceco;

    const mockData = {
        companyName: data?.name || "Apex Consulting",
        tagline: data?.tagline || "Strategic solutions that drive measurable business growth",
        services: data?.services || [
            { title: "Strategy Consulting", desc: "Data-driven insights to transform your business" },
            { title: "Digital Transformation", desc: "Modernize operations and unlock new revenue streams" },
            { title: "Change Management", desc: "Navigate organizational change with confidence" }
        ],
        results: data?.results || [
            { metric: "Average ROI", value: "3.5x" },
            { metric: "Client Retention", value: "95%" },
            { metric: "Projects Delivered", value: "500+" }
        ],
        clients: data?.clients || ["🏢", "🏦", "🏭", "🏪", "🏨", "🏛️"],
        ctaLink: data?.ctaLink || "#",
        servicesTitle: data?.servicesTitle || "Our Services",
        resultsTitle: data?.resultsTitle || "Our Results",
        clientsTitle: data?.clientsTitle || "Trusted by Industry Leaders"
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
                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            {mockData.companyName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12 max-w-3xl mx-auto" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        <a
                            href={mockData.ctaLink}
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            Schedule Consultation
                            <ArrowRight size={24} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Results */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12">
                        {mockData.resultsTitle}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.results.map((result, index) => (
                            <motion.div
                                key={index}
                                className="text-center p-8"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="text-6xl font-black mb-4" style={{ color: colors.primary }}>
                                    {result.value}
                                </div>
                                <div className="text-xl font-bold" style={{ color: colors.textLight }}>
                                    {result.metric}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.servicesTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.services.map((service, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="w-12 h-12 rounded-lg mb-6 flex items-center justify-center"
                                    style={{ backgroundColor: `${colors.primary}20` }}>
                                    <Check size={24} style={{ color: colors.primary }} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                                <p style={{ color: colors.textLight }}>{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted By */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black text-center mb-12">
                        {mockData.clientsTitle}
                    </h2>

                    <div className="flex justify-center gap-8 flex-wrap">
                        {mockData.clients.map((client, index) => (
                            <motion.div
                                key={index}
                                className="w-24 h-24 rounded-lg flex items-center justify-center text-4xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                            >
                                {client}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Ready to Transform Your Business?
                    </h2>
                    <p className="text-2xl mb-12" style={{ color: colors.textLight }}>
                        Let&apos;s discuss how we can help you achieve your goals
                    </p>
                    <a
                        href={mockData.ctaLink}
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                    >
                        <Mail size={28} />
                        Contact Us Today
                    </a>
                </div>
            </section>
        </div>
    );
}
