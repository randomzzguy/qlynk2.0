'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Truck } from 'lucide-react';
import { useState } from 'react';
import { themeColors } from '@/lib/themeColors';

/**
 * HardwareShowcase Theme - Product Category
 * Purpose: Physical products - gadgets, fashion, home goods
 * Aesthetic: E-commerce lite - 360° viewer, spec table, lifestyle shots
 * Color Palette: Slate (#475569) with Sky/Orange accents on light gray
 */
export default function HardwareShowcase({ data }) {
    const [selectedVariant, setSelectedVariant] = useState(0);
    const [selectedImage, setSelectedImage] = useState(0);
    const colors = themeColors.hardwareshowcase;

    const mockData = {
        productName: data?.name || "SmartWatch Pro",
        price: data?.price || "$299",
        gallery: data?.gallery || ["⌚", "📱", "💻", "🎧"],
        specs: data?.specs || [
            { key: "Display", value: "1.9\" AMOLED" },
            { key: "Battery Life", value: "7 days" },
            { key: "Water Resistance", value: "5ATM" },
            { key: "Connectivity", value: "Bluetooth 5.0, WiFi" },
            { key: "Weight", value: "45g" },
            { key: "Compatibility", value: "iOS & Android" }
        ],
        variants: data?.variants || [
            { name: "Midnight Black", inStock: true },
            { name: "Silver", inStock: true },
            { name: "Rose Gold", inStock: false }
        ],
        shippingNote: data?.shippingNote || "Free shipping on orders over $50. Ships within 2-3 business days.",
        specsTitle: data?.specsTitle || "Technical Specifications",
        variantsTitle: data?.variantsTitle || "Color"
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {/* Product Section */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
                    {/* Gallery */}
                    <div>
                        <motion.div
                            className="aspect-square rounded-3xl overflow-hidden mb-6"
                            style={{ backgroundColor: colors.bgAlt }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="w-full h-full flex items-center justify-center text-9xl">
                                {mockData.gallery[selectedImage]}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-4 gap-4">
                            {mockData.gallery.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className="aspect-square rounded-xl overflow-hidden border-2 transition-all"
                                    style={{
                                        backgroundColor: colors.bgAlt,
                                        borderColor: selectedImage === index ? colors.primary : colors.border
                                    }}
                                >
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        {img}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl font-black mb-4">
                                {mockData.productName}
                            </h1>

                            <div className="text-4xl font-black mb-8" style={{ color: colors.primary }}>
                                {mockData.price}
                            </div>

                            {/* Variants */}
                            <div className="mb-8">
                                <h3 className="font-bold mb-4">{mockData.variantsTitle}</h3>
                                <div className="flex gap-3">
                                    {mockData.variants.map((variant, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedVariant(index)}
                                            disabled={!variant.inStock}
                                            className="px-6 py-3 rounded-lg font-bold transition-all"
                                            style={{
                                                backgroundColor: selectedVariant === index ? colors.primary : colors.bgAlt,
                                                color: selectedVariant === index ? '#ffffff' : colors.text,
                                                opacity: variant.inStock ? 1 : 0.5,
                                                cursor: variant.inStock ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            {variant.name}
                                            {!variant.inStock && <span className="text-xs ml-2">(Out of Stock)</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <button
                                className="w-full px-8 py-5 rounded-lg font-bold text-xl mb-6 flex items-center justify-center gap-3 transition-all shadow-lg"
                                style={{ backgroundColor: colors.primary, color: '#ffffff' }}
                            >
                                <ShoppingCart size={24} />
                                Add to Cart
                            </button>

                            {/* Shipping Info */}
                            <div className="flex items-start gap-3 p-4 rounded-lg"
                                style={{ backgroundColor: colors.bgAlt }}>
                                <Truck size={20} style={{ color: colors.secondary }} className="shrink-0 mt-1" />
                                <p className="text-sm" style={{ color: colors.textLight }}>
                                    {mockData.shippingNote}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Key Specs */}
            <section className="py-20 px-6" style={{ backgroundColor: colors.bgAlt }}>
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        {mockData.specsTitle}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
                        {mockData.specs.map((spec, index) => (
                            <motion.div
                                key={index}
                                className="flex justify-between items-center pb-4 border-b"
                                style={{ borderColor: colors.border }}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                            >
                                <span className="font-bold">{spec.key}</span>
                                <span style={{ color: colors.textLight }}>{spec.value}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* In Context (Lifestyle) */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">
                        In Action
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((_, index) => (
                            <motion.div
                                key={index}
                                className="aspect-[4/5] rounded-2xl overflow-hidden"
                                style={{ backgroundColor: colors.bgAlt }}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <div className="w-full h-full flex items-center justify-center text-8xl">
                                    📸
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">
                        Ready to Upgrade?
                    </h2>
                    <p className="text-2xl mb-12 opacity-90">
                        Join thousands of satisfied customers
                    </p>
                    <button
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-lg font-bold text-2xl transition-all shadow-2xl"
                        style={{ backgroundColor: '#ffffff', color: colors.primary }}
                    >
                        <ShoppingCart size={28} />
                        Buy Now - {mockData.price}
                    </button>
                </div>
            </section>
        </div>
    );
}
