'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Star } from 'lucide-react';
import { themeColors } from '@/lib/themeColors';

/**
 * LocalBiz Theme - Business Category
 * Purpose: Brick-and-mortar businesses - restaurants, salons, gyms
 * Aesthetic: Warm, inviting, map-first, hours/location prominent
 * Color Palette: Red (#dc2626) with Amber/Lime accents on cream background
 */
export default function LocalBiz({ data }) {
    const colors = themeColors.localbiz;

    const mockData = {
        businessName: data?.name || "Bella's Bistro",
        tagline: data?.tagline || "Authentic Italian cuisine in the heart of downtown",
        address: data?.address || "123 Main Street, Austin, TX 78701",
        phone: data?.phone || "(512) 555-0123",
        email: data?.email || "hello@bellasbistro.com",
        hours: data?.hours || [
            { day: "Monday - Friday", time: "11:00 AM - 10:00 PM" },
            { day: "Saturday", time: "10:00 AM - 11:00 PM" },
            { day: "Sunday", time: "10:00 AM - 9:00 PM" }
        ],
        reviews: data?.reviews || [
            { text: "Best pasta in town! Authentic flavors and great service.", name: "Jessica M.", rating: 5 },
            { text: "Cozy atmosphere, delicious food. Highly recommend!", name: "Mike R.", rating: 5 },
            { text: "Family-owned gem. We come here every week!", name: "Sarah T.", rating: 5 }
        ],
        gallery: data?.gallery || ["🍝", "🍕", "🍷", "🥗"],
        hoursTitle: data?.hoursTitle || "Hours",
        reviewsTitle: data?.reviewsTitle || "What Our Customers Say",
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
                            {mockData.businessName}
                        </h1>
                        <p className="text-2xl md:text-3xl mb-12" style={{ color: colors.textLight }}>
                            {mockData.tagline}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={`tel:${mockData.phone}`}
                                className="inline-flex items-center gap-2 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-lg"
                                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                            >
                                <Phone size={24} />
                                Call Now
                            </a>
                            <a
                                href="#location"
                                className="inline-flex items-center gap-2 px-10 py-5 rounded-lg font-bold text-xl border-2 transition-all"
                                style={{ borderColor: colors.primary, color: colors.primary }}
                            >
                                <MapPin size={24} />
                                Get Directions
                            </a>
                        </div>
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

            {/* Hours & Contact */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <Clock size={32} style={{ color: colors.primary }} />
                            <h2 className="text-3xl font-black">{mockData.hoursTitle}</h2>
                        </div>

                        <div className="space-y-4">
                            {mockData.hours.map((schedule, index) => (
                                <div key={index} className="flex justify-between p-4 rounded-lg"
                                    style={{ backgroundColor: colors.bgAlt }}>
                                    <span className="font-bold">{schedule.day}</span>
                                    <span style={{ color: colors.textLight }}>{schedule.time}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <MapPin size={32} style={{ color: colors.primary }} />
                            <h2 className="text-3xl font-black">Location</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.bgAlt }}>
                                <p className="font-bold mb-2">Address</p>
                                <p style={{ color: colors.textLight }}>{mockData.address}</p>
                            </div>

                            <a
                                href={`tel:${mockData.phone}`}
                                className="block p-4 rounded-lg transition-all"
                                style={{ backgroundColor: colors.bgAlt }}
                            >
                                <p className="font-bold mb-2">Phone</p>
                                <p style={{ color: colors.primary }}>{mockData.phone}</p>
                            </a>

                            <a
                                href={`mailto:${mockData.email}`}
                                className="block p-4 rounded-lg transition-all"
                                style={{ backgroundColor: colors.bgAlt }}
                            >
                                <p className="font-bold mb-2">Email</p>
                                <p style={{ color: colors.primary }}>{mockData.email}</p>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Reviews */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.reviewsTitle}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {mockData.reviews.map((review, index) => (
                            <motion.div
                                key={index}
                                className="p-8 rounded-2xl"
                                style={{ backgroundColor: colors.bg }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={20} style={{ fill: colors.secondary, color: colors.secondary }} />
                                    ))}
                                </div>
                                <p className="text-lg mb-6 italic">&ldquo;{review.text}&rdquo;</p>
                                <p className="font-bold">— {review.name}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section id="location" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="aspect-video rounded-3xl overflow-hidden"
                        style={{ backgroundColor: colors.bgAlt }}>
                        <div className="w-full h-full flex items-center justify-center text-9xl">
                            🗺️
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Visit Us Today!
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        {mockData.address}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={`tel:${mockData.phone}`}
                            className="inline-flex items-center gap-2 px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl"
                            style={{ backgroundColor: '#ffffff', color: colors.primary }}
                        >
                            <Phone size={24} />
                            {mockData.phone}
                        </a>
                        <a
                            href="#location"
                            className="inline-flex items-center gap-2 px-10 py-5 rounded-lg font-bold text-xl border-2 border-white transition-all"
                        >
                            <MapPin size={24} />
                            Get Directions
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
