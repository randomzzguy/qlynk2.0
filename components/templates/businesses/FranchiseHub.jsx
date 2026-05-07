'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowRight } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * FranchiseHub Theme - Business Category
 * Purpose: Multi-location businesses - franchises, chains, retail networks
 * Aesthetic: Location finder, consistent branding, corporate + local balance
 * Color Palette: Blue (#0369a1) with Amber/Red accents on light blue
 */
export default function FranchiseHub({ data }) {
    const colors = themeColors.franchisehub;

    const mockData = {
        brandName: data?.name || "FreshBite Cafés",
        tagline: data?.tagline || "Fresh food, friendly service, in your neighborhood",
        locations: data?.locations || [
            { city: "Austin", address: "123 Main St", phone: "(512) 555-0101" },
            { city: "Dallas", address: "456 Oak Ave", phone: "(214) 555-0102" },
            { city: "Houston", address: "789 Pine Rd", phone: "(713) 555-0103" },
            { city: "San Antonio", address: "321 Elm St", phone: "(210) 555-0104" }
        ],
        aboutBrand: data?.aboutBrand || "Since 2010, we've been serving fresh, locally-sourced food across Texas. Each location maintains our high standards while celebrating local flavors.",
        franchiseLink: data?.franchiseLink || "#",
        locationsTitle: data?.locationsTitle || "Find a Location Near You"
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
                        <h1 className="text-6xl md:text-8xl font-black mb-6">
                            {mockData.brandName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        <div className="inline-block px-6 py-3 rounded-full font-bold text-xl"
                            style={{ backgroundColor: colors.bgAlt }}>
                            <MapPin size={20} className="inline mr-2" style={{ color: colors.primary }} />
                            {mockData.locations.length} Locations Across Texas
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Locations */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.locationsTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {mockData.locations.map((location, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <h3 className="text-3xl font-black mb-4" style={{ color: colors.primary }}>
                                    {location.city}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={20} style={{ color: colors.secondary }} className="shrink-0 mt-1" />
                                        <span>{location.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={20} style={{ color: colors.secondary }} />
                                        <a href={`tel:${location.phone}`} className="font-bold hover:underline">
                                            {location.phone}
                                        </a>
                                    </div>
                                </div>
                                <button
                                    className="w-full mt-6 px-6 py-3 rounded-lg font-bold transition-all"
                                    style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                                >
                                    Get Directions
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Brand */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-black mb-8">
                        Our Story
                    </h2>
                    <p className="text-xl leading-relaxed" style={{ color: colors.textLight }}>
                        {mockData.aboutBrand}
                    </p>
                </div>
            </section>

            {/* Franchise CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Interested in Franchising?
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        Join our growing family of successful locations
                    </p>
                    <a
                        href={mockData.franchiseLink}
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: '#ffffff', color: colors.primary }}
                    >
                        Learn More
                        <ArrowRight size={28} />
                    </a>
                </div>
            </section>
        </div>
    );
}
