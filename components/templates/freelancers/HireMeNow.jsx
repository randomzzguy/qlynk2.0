'use client';

import { motion } from 'framer-motion';
import { Clock, Zap, Mail, Calendar, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * HireMeNow Theme - Freelancer Category
 * Purpose: Urgency-focused for freelancers with immediate availability
 * Aesthetic: High-contrast red/black, countdown timers, bold CTAs, availability badge
 * Color Palette: Bold Red (#dc2626) with Orange accents on dark background
 */
export default function HireMeNow({ data }) {
    const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 12, minutes: 45 });
    const colors = themeColors.hiremenow;

    const mockData = {
        name: data?.name || "Alex Smith",
        available: data?.available ?? true,
        offer: data?.offer || {
            title: "20% Off First Project",
            desc: "Limited time offer for new clients",
            expiry: "2024-12-31"
        },
        pricingTiers: data?.pricingTiers || [
            {
                name: "Starter",
                price: "$500",
                features: ["1 Page Website", "Mobile Responsive", "Basic SEO", "1 Week Delivery"]
            },
            {
                name: "Professional",
                price: "$1,500",
                features: ["5 Page Website", "Custom Design", "Advanced SEO", "CMS Integration", "2 Week Delivery"]
            },
            {
                name: "Enterprise",
                price: "$3,500",
                features: ["Unlimited Pages", "Full Branding", "E-commerce", "Analytics", "Priority Support", "4 Week Delivery"]
            }
        ],
        calendlyUrl: data?.calendlyUrl || "https://calendly.com/yourname",
        email: data?.email || "urgent@example.com",
        pricingTitle: data?.pricingTitle || "Fast-Track Pricing",
        calendarTitle: data?.calendarTitle || "Availability"
    };

    // Countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.minutes > 0) {
                    return { ...prev, minutes: prev.minutes - 1 };
                } else if (prev.hours > 0) {
                    return { ...prev, hours: prev.hours - 1, minutes: 59 };
                } else if (prev.days > 0) {
                    return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
                }
                return prev;
            });
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Header */}
            <header className="p-6 flex justify-between items-center border-b border-gray-800">
                <span className="text-xl font-black uppercase tracking-wider">
                    {mockData.name}
                </span>
                <span className="text-sm font-bold px-3 py-1 rounded" style={{ backgroundColor: colors.bgAlt }}>
                    FREELANCE DEVELOPER
                </span>
            </header>

            {/* Availability Banner */}
            <motion.div
                className="py-3 px-6 text-center font-bold"
                style={{ backgroundColor: mockData.available ? colors.primary : colors.bgAlt }}
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-center gap-2">
                    {mockData.available ? (
                        <>
                            <Zap size={20} className="animate-pulse" />
                            <span>AVAILABLE NOW - Accepting New Projects</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={20} />
                            <span>Currently Booked - Join Waitlist</span>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Hero Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            Need It Done
                            <span className="block" style={{ color: colors.primary }}>
                                Yesterday?
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto" style={{ color: colors.textLight }}>
                            Fast-track web development with guaranteed delivery. No waiting lists, no delays.
                        </p>
                    </motion.div>

                    {/* Offer Countdown */}
                    {mockData.available && (
                        <motion.div
                            className="max-w-2xl mx-auto mb-12 p-8 rounded-2xl border-2"
                            style={{
                                backgroundColor: colors.bgAlt,
                                borderColor: colors.primary
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Clock size={24} style={{ color: colors.secondary }} />
                                <h3 className="text-2xl font-bold">{mockData.offer.title}</h3>
                            </div>
                            <p className="mb-6" style={{ color: colors.textLight }}>
                                {mockData.offer.desc}
                            </p>

                            {/* Countdown Timer */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Days', value: timeLeft.days },
                                    { label: 'Hours', value: timeLeft.hours },
                                    { label: 'Minutes', value: timeLeft.minutes }
                                ].map(({ label, value }) => (
                                    <div key={label} className="text-center">
                                        <div
                                            className="text-4xl font-black mb-2"
                                            style={{ color: colors.primary }}
                                        >
                                            {value.toString().padStart(2, '0')}
                                        </div>
                                        <div className="text-sm" style={{ color: colors.textLight }}>
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <a
                            href={mockData.calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-10 py-5 rounded-lg font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: colors.primary,
                                color: colors.text
                            }}
                        >
                            <Calendar size={24} />
                            Book Urgent Call
                        </a>
                        <a
                            href={`mailto:${mockData.email}`}
                            className="px-10 py-5 rounded-lg font-black text-xl border-2 transition-all flex items-center justify-center gap-2"
                            style={{
                                borderColor: colors.secondary,
                                color: colors.secondary
                            }}
                        >
                            <Mail size={24} />
                            Email Now
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Tiers */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.pricingTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.pricingTiers.map((tier, index) => (
                            <motion.div
                                key={tier.name}
                                className="rounded-2xl p-8 border-2 relative overflow-hidden"
                                style={{
                                    backgroundColor: colors.bg,
                                    borderColor: index === 1 ? colors.primary : colors.border
                                }}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                            >
                                {index === 1 && (
                                    <div
                                        className="absolute top-0 right-0 px-4 py-1 text-sm font-bold"
                                        style={{ backgroundColor: colors.primary, color: colors.text }}
                                    >
                                        POPULAR
                                    </div>
                                )}

                                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                <div className="text-5xl font-black mb-6" style={{ color: colors.primary }}>
                                    {tier.price}
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check size={20} style={{ color: colors.primary }} className="shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="w-full py-3 rounded-lg font-bold transition-all"
                                    style={{
                                        backgroundColor: index === 1 ? colors.primary : 'transparent',
                                        color: index === 1 ? colors.text : colors.primary,
                                        border: index === 1 ? 'none' : `2px solid ${colors.primary}`
                                    }}
                                >
                                    Get Started
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-6">
                            Don&apos;t Wait. Start Today.
                        </h2>
                        <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                            Limited availability. First-come, first-served.
                        </p>
                        <a
                            href={mockData.calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-12 py-6 rounded-lg font-black text-2xl transition-all shadow-2xl"
                            style={{
                                backgroundColor: colors.primary,
                                color: colors.text
                            }}
                        >
                            Claim Your Spot →
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Sticky Mobile CTA */}
            <motion.a
                href={mockData.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50"
                style={{ backgroundColor: colors.primary, color: colors.text }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <Zap size={28} />
            </motion.a>
        </div>
    );
}
