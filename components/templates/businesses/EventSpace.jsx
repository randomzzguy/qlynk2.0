'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Mail } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * EventSpace Theme - Business Category
 * Purpose: Venues for hire - event spaces, studios, meeting rooms
 * Aesthetic: Visual-heavy, booking calendar widget, capacity info, virtual tour
 * Color Palette: Purple (#9333ea) with Pink/Orange accents on light purple
 */
export default function EventSpace({ data }) {
    const colors = themeColors.eventspace;

    const mockData = {
        venueName: data?.name || "The Grand Ballroom",
        tagline: data?.tagline || "Elegant event space in the heart of downtown",
        capacity: data?.capacity || "Up to 300 guests",
        amenities: data?.amenities || [
            "Full catering kitchen",
            "State-of-the-art A/V",
            "Flexible floor plan",
            "On-site parking",
            "Bridal suite",
            "Outdoor patio"
        ],
        gallery: data?.gallery || ["🏛️", "🎭", "🎪", "🎨"],
        pricing: data?.pricing || "Starting at $2,500/event",
        bookingLink: data?.bookingLink || "#",
        amenitiesTitle: data?.amenitiesTitle || "Amenities & Features",
        galleryTitle: data?.galleryTitle || "Gallery"
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
                        <h1 className="text-6xl md:text-8xl font-black mb-6">
                            {mockData.venueName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-8" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>
                        <div className="flex items-center justify-center gap-6 mb-12 text-xl">
                            <div className="flex items-center gap-2">
                                <Users size={24} style={{ color: colors.primary }} />
                                <span>{mockData.capacity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={24} style={{ color: colors.primary }} />
                                <span>Downtown</span>
                            </div>
                        </div>

                        <a
                            href={mockData.bookingLink}
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                        >
                            <Calendar size={24} />
                            Check Availability
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Gallery */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-12">
                        {mockData.galleryTitle}
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {mockData.gallery.map((img, index) => (
                            <motion.div
                                key={index}
                                className="aspect-square rounded-2xl overflow-hidden"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="w-full h-full flex items-center justify-center text-8xl">
                                    {img}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Amenities */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.amenitiesTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        {mockData.amenities.map((amenity, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-xl text-center"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.05 }}
                            >
                                <p className="text-lg font-bold">{amenity}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing & CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Book Your Event
                    </h2>
                    <p className="text-3xl mb-12 opacity-90">
                        {mockData.pricing}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={mockData.bookingLink}
                            className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                            style={{ backgroundColor: '#ffffff', color: colors.primary }}
                        >
                            <Calendar size={28} />
                            Check Availability
                        </a>
                        <a
                            href="mailto:events@venue.com"
                            className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl border-2 border-white transition-all"
                        >
                            <Mail size={28} />
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
