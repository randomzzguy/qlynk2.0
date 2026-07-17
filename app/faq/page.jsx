import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk AI FAQ | Personal AI Agent Questions',
  description: 'Get clear answers about Qlynk AI, personal AI agents, AI clones, training data, availability, customization, privacy, and pricing.',
  path: '/faq',
});

const faqs = [
  {
    category: "General",
    items: [
      {
        q: "What is Qlynk?",
        a: "Qlynk AI is a personal AI agent platform. It lets you create an AI clone trained on the professional knowledge you choose to provide, so visitors can learn about you, ask questions, and find the right next step at your personal qlynk.site/username link."
      },
      {
        q: "How does Qlynk work?",
        a: "Claim your qlynk.site/username address, add your bio, experience, projects, FAQs, links, and supported documents, then publish and share your Qlynk AI agent. You can update its knowledge and settings from the dashboard."
      },
      {
        q: "Who is Qlynk for?",
        a: "Qlynk AI is built for freelancers, consultants, founders, creators, job seekers, professionals, and expert-led businesses that want a conversational way to explain their work online."
      },
      {
        q: "Is Qlynk an AI chatbot?",
        a: "Qlynk uses conversational AI, but it is designed as a personal AI agent rather than a generic scripted chatbot. It represents the knowledge and professional context its owner provides."
      },
      {
        q: "How is Qlynk different from ChatGPT?",
        a: "ChatGPT is a general-purpose AI assistant. A Qlynk Agent is a published, branded personal AI experience focused on one person or business, using owner-provided knowledge, links, instructions, and visitor insights."
      },
      {
        q: "Can my AI answer questions while I am offline?",
        a: "Yes. Once your Qlynk Agent is published and active, visitors can use it while you are away from your computer. Qlynk is a web service, so visitors still need an internet connection and your agent must remain enabled."
      },
      {
        q: "What data can I train my AI with?",
        a: "You can add structured profile information, a bio, skills, projects, social and booking links, FAQs, additional instructions, and supported documents. Only provide information you have the right to use and want the agent to know."
      },
      {
        q: "How much does Qlynk cost?",
        a: "Qlynk offers a 14-day free trial with no charge today. After the trial, you can choose a plan based on your message, document, branding, analytics, and agent needs. Current details are available on the Pricing page."
      },
      {
        q: "How long does setup take?",
        a: "The initial setup is designed to take only a few minutes. The time needed to fully train your AI clone depends on how much professional knowledge and supporting material you add."
      }
    ]
  },
  {
    category: "Features",
    items: [
      {
        q: "Can I customize my AI agent's responses?",
        a: "Yes. You can manage its knowledge, additional instructions, welcome message, identity, appearance, and supporting links. You remain responsible for reviewing the information you provide and how the agent is used."
      },
      {
        q: "What can visitors do with my AI clone?",
        a: "Visitors can ask about your work, skills, experience, services, products, and projects; follow relevant links; and use the contact or booking paths you provide."
      },
      {
        q: "Can I see what people are asking?",
        a: "Yes. Qlynk provides conversation and engagement insights so you can understand popular questions and improve the information available to visitors."
      },
      {
        q: "Can I update my AI agent's knowledge?",
        a: "Yes. You can add, edit, or remove knowledge from your dashboard as your work and priorities change."
      }
    ]
  },
  {
    category: "Privacy & Security",
    items: [
      {
        q: "How do I keep private information out of my agent?",
        a: "Only add information that you want the agent to use, review documents before uploading them, and remove knowledge that should no longer be available. Do not upload secrets or information you are not authorized to process."
      },
      {
        q: "Can I control whether my AI clone is live?",
        a: "Yes. Agent owners can manage their agent configuration and availability from the authenticated dashboard."
      }
    ]
  },
  {
    category: "Sharing & Access",
    items: [
      {
        q: "Does Qlynk work on mobile?",
        a: "Yes. Public Qlynk Agent pages are designed to work on desktop, tablet, and mobile browsers."
      },
      {
        q: "Can I share my Qlynk link on social media?",
        a: "Yes. Your qlynk.site/username link can be added to social profiles, portfolios, email signatures, and other places where people discover your work."
      },
      {
        q: "Can I use my own domain?",
        a: "Custom domain support is included in the Agency plan. See the Pricing page for the current plan details."
      }
    ]
  }
];

export default function FAQPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap((section) => section.items).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 relative overflow-hidden">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }])} />
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about creating and managing your personal AI agent.
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-6 border-b border-white/10 pb-4">
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.items.map((item, itemIdx) => (
                  <details
                    key={itemIdx}
                    className="group border border-white/5 bg-white/5 rounded-xl transition-all duration-300 hover:bg-white/10"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer font-medium text-lg text-gray-200 select-none list-none [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:-rotate-180" />
                    </summary>
                    <div className="p-5 pt-0 text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-10 backdrop-blur-md">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to create your AI clone?</h3>
          <p className="text-gray-300 mb-8">14-day free trial · No charge today · 5-minute setup</p>
          <Link 
            href="/auth/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Get Started Free
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
