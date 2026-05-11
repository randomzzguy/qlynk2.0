'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const lastUpdated = "May 11, 2026";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <QlynkBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center group">
              <Image src="/logoWhite.svg" alt="qlynk logo" width={100} height={40} priority />
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Lock size={14} />
              Data Protection
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Privacy Policy</h1>
            <p className="text-gray-500 mb-12">Last Updated: {lastUpdated}</p>

            <div className="space-y-10 prose prose-invert max-w-none">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                <p className="leading-relaxed">
                  We collect information you provide directly to us, such as when you create an account, train your q-agent, or contact support. This includes your name, email address, password, bio, and any documents you upload to train your AI.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <p className="leading-relaxed">
                  We use your information to provide, maintain, and improve the Service, specifically to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
                  <li>Power your personal AI agent (q-agent).</li>
                  <li>Process payments and subscriptions.</li>
                  <li>Send you technical notices and support messages.</li>
                  <li>Respond to your comments and questions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. AI Training and Data</h2>
                <p className="leading-relaxed">
                  The data you provide to train your q-agent is used specifically for that purpose. We do not sell your personal data or your AI training data to third parties. Your documents are stored securely and processed to allow the AI to answer questions accurately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Sharing of Information</h2>
                <p className="leading-relaxed">
                  We may share information with third-party vendors and service providers (such as Stripe for payments and Supabase for database hosting) who need access to such information to carry out work on our behalf.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Security</h2>
                <p className="leading-relaxed">
                  We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Your Choices</h2>
                <p className="leading-relaxed">
                  You may update or delete your account information at any time by logging into your dashboard. You can also delete your trained data and documents through the dashboard.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at privacy@qlynk.site.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
