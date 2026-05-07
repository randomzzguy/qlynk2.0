'use client';

import { motion } from 'framer-motion';
import { Mail, Calendar, ArrowRight, Star } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * QuickPitch Theme - Freelancer Category
 * Purpose: Fast, minimal landing page to convert visitors into clients in under 5 seconds
 * Aesthetic: Bold typography, vibrant blue accent, full-viewport hero, zero clutter
 * Color Palette: Professional Blue (#2563eb) with Amber accents
 */
export default function QuickPitch({ data }) {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const colors = themeColors.quickpitch;

    // Mock data structure - will be replaced with actual user data
    const mockData = {
        name: data?.name || "John Doe",
        headline: data?.headline || "I Build Websites That Convert",
        subhead: data?.subhead || "Helping businesses grow with modern web solutions. Available now.",
        services: data?.services || [
            { title: "Web Development", desc: "Custom websites built with React & Next.js" },
            { title: "UI/UX Design", desc: "Beautiful interfaces that users love" },
            { title: "SEO Optimization", desc: "Get found on Google, drive organic traffic" }
        ],
        testimonials: data?.testimonials || [
            { quote: "Delivered ahead of schedule with exceptional quality. Highly recommend!", name: "Sarah Chen", role: "CEO, TechStart" },
            { quote: "Transformed our online presence completely. Sales up 300%.", name: "Mike Rodriguez", role: "Founder, GrowthCo" },
            { quote: "Professional, responsive, and incredibly talented. A pleasure to work with.", name: "Emma Thompson", role: "Marketing Director" }
        ],
        email: data?.email || "hello@yourname.com",
        calendlyUrl: data?.calendlyUrl || "https://calendly.com/yourname",
        servicesTitle: data?.servicesTitle || "What I Do",
        testimonialsTitle: data?.testimonialsTitle || "Client Love"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
            {/* Header */}
            <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
                <span className="text-xl font-black tracking-tight" style={{ color: colors.text }}>
                    {mockData.name}
                </span>
            </nav>

            {/* Hero Section - Full Viewport */}
            <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
                {/* Accent Background Element */}
                <motion.div
                    className="absolute top-0 right-0 w-1/2 h-full opacity-5"
                    style={{ background: `linear-gradient(to left, ${colors.primary}, transparent)` }}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 0.05, x: 0 }}
                    transition={{ duration: 0.8 }}
                />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-black mb-6">
                        Hi, I&apos;m {mockData.name}.
                    </h1>
                    <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                        I help startups ship {mockData.expertise} in weeks, not months.
                    </p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <a
                            href={`mailto:${mockData.email}`}
                            className="group px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            style={{
                                backgroundColor: colors.primary,
                                color: '#ffffff'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                        >
                            <Mail size={20} />
                            Get In Touch
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </a>

                        <a
                            href={mockData.calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 border-2 rounded-lg font-bold text-lg transition-all flex items-center gap-2"
                            style={{
                                borderColor: colors.text,
                                color: colors.text
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.text;
                                e.currentTarget.style.color = colors.bg;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.text;
                            }}
                        >
                            <Calendar size={20} />
                            Book a Call
                        </a>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        className="absolute bottom-12 left-1/2 -translate-x-1/2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                    >
                        <motion.div
                            className="w-6 h-10 border-2 rounded-full flex justify-center p-2"
                            style={{ borderColor: colors.textLight }}
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <div className="w-1 h-2 rounded-full" style={{ backgroundColor: colors.textLight }} />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Services Section - 3-Item Grid */}
            <section className="py-24 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black text-center mb-16"
                        style={{ color: colors.text }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {mockData.servicesTitle}
                    </motion.h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.services.map((service, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                    style={{ backgroundColor: `${colors.primary}15` }}
                                >
                                    <div className="w-6 h-6 rounded" style={{ backgroundColor: colors.primary }} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                                    {service.title}
                                </h3>
                                <p className="leading-relaxed" style={{ color: colors.textLight }}>
                                    {service.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section - Carousel */}
            <section className="py-24 px-6" style={{ backgroundColor: colors.bg }}>
                <div className="max-w-4xl mx-auto">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black text-center mb-16"
                        style={{ color: colors.text }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {mockData.testimonialsTitle}
                    </motion.h2>

                    <div className="relative">
                        <motion.div
                            key={activeTestimonial}
                            className="p-12 rounded-2xl"
                            style={{ backgroundColor: colors.bgAlt }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-6 h-6"
                                        style={{ fill: colors.secondary, color: colors.secondary }}
                                    />
                                ))}
                            </div>

                            <p className="text-2xl mb-8 leading-relaxed italic" style={{ color: colors.text }}>
                                &quot;{mockData.testimonials[activeTestimonial].quote}&quot;
                            </p>

                            <div>
                                <p className="font-bold text-lg" style={{ color: colors.text }}>
                                    {mockData.testimonials[activeTestimonial].name}
                                </p>
                                <p style={{ color: colors.textLight }}>
                                    {mockData.testimonials[activeTestimonial].role}
                                </p>
                            </div>
                        </motion.div>

                        {/* Carousel Controls */}
                        <div className="flex justify-center gap-2 mt-8">
                            {mockData.testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTestimonial(index)}
                                    className="h-3 rounded-full transition-all"
                                    style={{
                                        width: index === activeTestimonial ? '32px' : '12px',
                                        backgroundColor: index === activeTestimonial ? colors.primary : colors.border
                                    }}
                                    aria-label={`View testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section - Inline */}
            <section className="py-24 px-6" style={{ backgroundColor: colors.text }}>
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black mb-6"
                        style={{ color: colors.bg }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Let&apos;s Work Together
                    </motion.h2>

                    <motion.p
                        className="text-xl mb-12"
                        style={{ color: colors.bgAlt }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Ready to start your project? Drop me a line or schedule a free consultation.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <a
                            href={`mailto:${mockData.email}`}
                            className="px-8 py-4 rounded-lg font-bold text-lg transition-all inline-flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: colors.primary,
                                color: '#ffffff'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                        >
                            <Mail size={20} />
                            {mockData.email}
                        </a>

                        <a
                            href={mockData.calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 border-2 rounded-lg font-bold text-lg transition-all inline-flex items-center justify-center gap-2"
                            style={{
                                borderColor: colors.bg,
                                color: colors.bg
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.bg;
                                e.currentTarget.style.color = colors.text;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.bg;
                            }}
                        >
                            <Calendar size={20} />
                            Schedule Call
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Sticky CTA Button - Mobile */}
            <motion.a
                href={`mailto:${mockData.email}`}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-50"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            >
                <Mail size={24} />
            </motion.a>
        </div>
    );
}
