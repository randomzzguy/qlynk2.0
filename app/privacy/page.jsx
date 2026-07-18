'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import QlynkBackground from '@/components/QlynkBackground';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  const lastUpdated = "July 11, 2026";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <QlynkBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center group">
              <Image src="/logoWhite.svg" alt="Qlynk AI logo" width={100} height={40} priority />
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
                  We collect information you provide directly to us when you create an account, train a Qlynk Agent, subscribe, or contact support. This may include your name, email address, profile details, agent instructions, links, and documents or text you upload. Account passwords are handled by our authentication provider; Qlynk does not store them as readable text.
                </p>
                <p className="leading-relaxed mt-4">
                  When someone visits or chats with an agent, we may collect a visitor identifier, name and email if provided or required by the agent owner, conversation messages, timestamps, referring page, and technical request information such as IP address and browser details. The agent owner can view the conversation, supplied contact details, and generated conversation insights such as sentiment.
                </p>
                <p className="leading-relaxed mt-4">
                  Qlynk may classify requests to enforce an agent&apos;s approved scope and detect prompt-injection, off-topic, or safety abuse. Security-event records use a one-way hashed visitor key, event category, agent type, and prompt version; they intentionally do not duplicate the raw visitor message. The original conversation message may still be retained in the agent conversation as described above.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                <p className="leading-relaxed">
                  We use your information to provide, maintain, and improve the Service, specifically to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400">
                  <li>Power and operate your configured Qlynk Agent.</li>
                  <li>Process payments and subscriptions.</li>
                  <li>Send you technical notices and support messages.</li>
                  <li>Respond to your comments and questions.</li>
                  <li>Protect the Service, enforce usage limits, diagnose errors, and prevent abuse.</li>
                  <li>Provide agent owners with conversations, analytics, and interaction insights.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. AI Training and Data</h2>
                <p className="leading-relaxed">
                  Agent instructions, knowledge, and relevant conversation history are sent to Groq to generate AI responses. Conversation messages may also be sent to Groq for scope, safety, and general sentiment classification. AI providers process this information on Qlynk&apos;s behalf; Qlynk does not use visitor conversations or private agent knowledge to train a Qlynk-owned general-purpose AI model. Do not upload or submit information you are not authorized to process.
                </p>
                <p className="leading-relaxed mt-4">
                  AI responses are generated automatically and may be inaccurate. Agent owners are responsible for the knowledge and instructions they provide and for reviewing the suitability of their agent for its intended use.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Sharing of Information</h2>
                <p className="leading-relaxed">
                  We use service providers to operate Qlynk, including Supabase for authentication, database, and file storage; Groq for AI inference and sentiment classification; Stripe for checkout, subscriptions, and invoices; Resend for transactional email; hCaptcha for bot protection; and Vercel for application hosting and delivery. These providers receive information only as needed to perform their services. We may also disclose information when required by law, to protect rights and safety, or as part of a business transaction. We do not sell personal information or private AI training data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Security</h2>
                <p className="leading-relaxed">
                  We use reasonable technical and organizational safeguards designed to protect information from unauthorized access, disclosure, alteration, and destruction. No internet service is completely secure, so we cannot guarantee absolute security. Service providers may process information in countries other than your own, subject to their contractual and legal transfer safeguards.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Retention and Deletion</h2>
                <p className="leading-relaxed">
                  We generally retain account, agent, knowledge, document, conversation, and subscription records while an account is active and as needed to provide the Service. Agent owners can delete knowledge and documents from the dashboard and can request immediate account deletion or schedule deletion after the displayed grace period. Account deletion removes active account data and requests cancellation or deletion from connected services where applicable. Limited records may remain temporarily in provider backups, security logs, fraud-prevention records, or where retention is required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Local Storage</h2>
                <p className="leading-relaxed">
                  Qlynk uses authentication cookies required to keep users signed in. Public agent experiences may use browser storage to maintain a visitor identifier, conversation continuity, and interface preferences. We also process referrer and page-view information for agent-owner analytics. Browser settings can clear local data, although doing so may reset conversations or require signing in again.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Your Choices and Rights</h2>
                <p className="leading-relaxed">
                  Account holders can update profile information and notification preferences, delete training data, and delete their account through the dashboard. Depending on where you live, you may also have rights to access, correct, delete, restrict, object to, or receive a copy of personal information. Visitors seeking access to a conversation should identify the agent they contacted so we can locate the relevant records. We may need to verify a request before acting on it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
                <p className="leading-relaxed">
                  For privacy questions or requests, contact <a className="text-blue-400 hover:text-blue-300" href="mailto:privacy@qlynk.site">privacy@qlynk.site</a>. Please do not send passwords or sensitive document contents by email.
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
