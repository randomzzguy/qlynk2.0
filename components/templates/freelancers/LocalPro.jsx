'use client';

import { motion } from 'framer-motion';
import { MapPin, Star, Phone, Mail, MessageCircle } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * LocalPro Theme - Freelancer Category
 * Purpose: Service-area-based freelancers targeting local clients
 * Aesthetic: Warm, community feel with map embeds, local imagery, trust badges
 * Color Palette: Warm Orange (#ea580c) with Lime accents on cream background
 */
export default function LocalPro({ data }) {
    const colors = themeColors.localpro;

    const mockData = {
        name: data?.name || "Your Business Name",
        serviceArea: data?.serviceArea || "Austin, TX",
        since: data?.since || "2018",
        gallery: data?.gallery || [
            { location: "Downtown Austin", alt: "Project 1" },
            { location: "South Congress", alt: "Project 2" },
            { location: "East Austin", alt: "Project 3" },
            { location: "Westlake", alt: "Project 4" }
        ],
        reviews: data?.reviews || [
            { text: "Best photographer in Austin! Captured our wedding perfectly.", name: "Jessica & Tom", location: "Austin, TX", rating: 5 },
            { text: "Professional, punctual, and produces amazing work.", name: "Sarah M.", location: "Round Rock, TX", rating: 5 },
            { text: "Highly recommend for any local events or portraits!", name: "Mike Rodriguez", location: "Pflugerville, TX", rating: 5 },
            { text: "Great experience from start to finish. Will hire again!", name: "Emily Chen", location: "Cedar Park, TX", rating: 5 }
        ],
        faq: data?.faq || [
            { q: "Do you travel outside Austin?", a: "Yes! I serve the greater Austin metro area including Round Rock, Cedar Park, and Pflugerville." },
            { q: "What's your typical turnaround time?", a: "Most projects are delivered within 2 weeks of the session." },
            { q: "Do you offer weekend availability?", a: "Absolutely! Weekends are my most popular booking times." }
        ],
        phone: data?.phone || "(512) 555-0123",
        email: data?.email || "hello@localpro.com",
        mapEmbedUrl: data?.mapEmbedUrl || "https://maps.google.com",
        galleryTitle: data?.galleryTitle || "Recent Work Around Town",
        reviewsTitle: data?.reviewsTitle || "What Locals Are Saying",
        faqTitle: data?.faqTitle || "Common Questions",
        mapTitle: data?.mapTitle || "Let's Connect"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Hero with Service Area Badge */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 font-bold"
                            style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                            <MapPin size={20} />
                            Proudly Serving {mockData.serviceArea}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black mb-6">
                            {mockData.name}
                        </h1>

                        <p className="text-2xl mb-8" style={{ color: colors.textLight }}>
                            Capturing life&apos;s moments in the heart of {mockData.serviceArea} since {mockData.since}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={`tel:${mockData.phone}`}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg"
                                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                            >
                                <Phone size={20} />
                                Call Now: {mockData.phone}
                            </a>
                            <a
                                href={`mailto:${mockData.email}`}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg border-2 transition-all"
                                style={{ borderColor: colors.primary, color: colors.primary }}
                            >
                                <Mail size={20} />
                                Email Me
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Gallery with Location Tags */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black mb-12 text-center">
                        {mockData.galleryTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mockData.gallery.map((item, index) => (
                            <motion.div
                                key={index}
                                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                                style={{ backgroundColor: colors.border }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                onClick={() => setSelectedImage(index)}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MapPin size={16} />
                                    <span className="text-sm font-bold">{item.location}</span>
                                </div>
                                {/* Placeholder for actual image */}
                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                    📸
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reviews with Locations */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black mb-12 text-center">
                        {mockData.reviewsTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {mockData.reviews.map((review, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-2xl"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={20} style={{ fill: colors.secondary, color: colors.secondary }} />
                                    ))}
                                </div>

                                <p className="text-lg mb-4 italic">&ldquo;{review.text}&rdquo;</p>

                                <div>
                                    <p className="font-bold">{review.name}</p>
                                    <p className="text-sm flex items-center gap-1" style={{ color: colors.textLight }}>
                                        <MapPin size={14} />
                                        {review.location}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ - Local Specific */}
            <section className="py-16 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black mb-12 text-center">
                        {mockData.faqTitle}
                    </h2>

                    <div className="space-y-4">
                        {mockData.faq.map((item, index) => (
                            <motion.div
                                key={index}
                                className="p-6 rounded-xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <h3 className="text-xl font-bold mb-3" style={{ color: colors.primary }}>
                                    {item.q}
                                </h3>
                                <p style={{ color: colors.textLight }}>{item.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact + Map */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-4xl font-black mb-6">
                                {mockData.mapTitle}
                            </h2>
                            <p className="text-xl mb-8" style={{ color: colors.textLight }}>
                                Serving the {mockData.serviceArea} area with pride. Reach out today!
                            </p>

                            <div className="space-y-4">
                                <a
                                    href={`tel:${mockData.phone}`}
                                    className="flex items-center gap-3 p-4 rounded-lg transition-all"
                                    style={{ backgroundColor: colors.bgAlt }}
                                >
                                    <Phone size={24} style={{ color: colors.primary }} />
                                    <span className="font-bold">{mockData.phone}</span>
                                </a>

                                <a
                                    href={`mailto:${mockData.email}`}
                                    className="flex items-center gap-3 p-4 rounded-lg transition-all"
                                    style={{ backgroundColor: colors.bgAlt }}
                                >
                                    <Mail size={24} style={{ color: colors.primary }} />
                                    <span className="font-bold">{mockData.email}</span>
                                </a>

                                <div className="flex items-center gap-3 p-4 rounded-lg"
                                    style={{ backgroundColor: colors.bgAlt }}>
                                    <MessageCircle size={24} style={{ color: colors.primary }} />
                                    <span className="font-bold">Text for Quick Response</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="aspect-square rounded-2xl overflow-hidden"
                                style={{ backgroundColor: colors.border }}>
                                {/* Map placeholder */}
                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                    🗺️
                                </div>
                            </div>
                            <p className="text-center mt-4 text-sm" style={{ color: colors.textLight }}>
                                <MapPin size={16} className="inline" /> {mockData.serviceArea}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
