'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';

export default function TermsPage() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f46530]/10 border border-[#f46530]/20 text-[#f46530] text-xs font-bold uppercase tracking-widest mb-6">
              <Shield size={14} />
              Legal Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Terms of Service</h1>
            <p className="text-gray-500 mb-12">Last Updated: {lastUpdated}</p>

            <div className="space-y-10 prose prose-invert max-w-none">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="leading-relaxed">
                  By accessing or using Qlynk (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                <p className="leading-relaxed">
                  Qlynk provides a platform for users to create AI-powered personal ambassadors ("q-agents"). The service includes tools for training the AI, hosting a public profile, and analyzing interactions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                <p className="leading-relaxed">
                  You are responsible for maintaining the security of your account and password. Qlynk cannot and will not be liable for any loss or damage from your failure to comply with this security obligation. You are responsible for all content posted and activity that occurs under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Content and Conduct</h2>
                <p className="leading-relaxed">
                  You may not use the Service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction. You agree not to upload or transmit any content that is offensive, harmful, or infringes on the intellectual property of others.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Payment and Refunds</h2>
                <p className="leading-relaxed">
                  The Service offers a 14-day free trial. A valid credit card is required to start the trial. If you do not cancel before the trial ends, you will be automatically billed for the Creator plan. All fees are non-refundable except as required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Termination</h2>
                <p className="leading-relaxed">
                  Qlynk, in its sole discretion, has the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Modifications to the Service</h2>
                <p className="leading-relaxed">
                  Qlynk reserves the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
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
