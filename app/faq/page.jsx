import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { breadcrumbSchema, createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Qlynk AI FAQ | AI Agent Platform Questions',
  description: 'Get clear answers about Qlynk AI agent types, knowledge, rules, scope, availability, customization, privacy, and pricing.',
  path: '/faq',
});

const faqs = [
  {
    category: "General",
    items: [
      {
        q: "What is Qlynk?",
        a: "Qlynk AI is a no-code platform for building focused AI agents from approved knowledge and owner-defined rules. You can publish the agent at a qlynk.site/username link so people can ask questions within its configured purpose."
      },
      {
        q: "How does Qlynk work?",
        a: "Claim your qlynk.site/username address, choose an agent type, define its purpose and audience, set topic and behavior boundaries, add approved knowledge, then publish and share it. You can review conversations and update everything from the dashboard."
      },
      {
        q: "Who is Qlynk for?",
        a: "Qlynk supports people and experts, businesses and services, properties and venues, operations and training teams, products, customer-support workflows, and custom focused use cases."
      },
      {
        q: "Is Qlynk an AI chatbot?",
        a: "Qlynk uses conversational AI, but each agent is built around an owner-defined job, approved knowledge, and explicit boundaries rather than a fixed script or unrestricted general assistant."
      },
      {
        q: "How is Qlynk different from ChatGPT?",
        a: "ChatGPT is a general-purpose AI assistant. A Qlynk Agent is a published, branded experience focused on one configured person, business, place, operation, product, support workflow, or custom purpose, using owner-provided knowledge and rules."
      },
      {
        q: "Can my AI answer questions while I am offline?",
        a: "Yes. Once your Qlynk Agent is published and active, visitors can use it while you are away from your computer. Qlynk is a web service, so visitors still need an internet connection and your agent must remain enabled."
      },
      {
        q: "What data can I train my AI with?",
        a: "You can add profile context, capabilities, examples, contact and social links, manual facts, FAQs, website links, custom knowledge, and supported documents. Only provide information you have the right to use and want the agent to know."
      },
      {
        q: "How much does Qlynk cost?",
        a: "Qlynk offers a 14-day free trial with no charge today. After the trial, you can choose a plan based on your message, document, branding, analytics, and agent needs. Current details are available on the Pricing page."
      },
      {
        q: "How long does setup take?",
        a: "The initial role and purpose can be set in a few minutes. A useful production setup takes longer when the job needs detailed rules, FAQs, procedures, documents, or carefully reviewed knowledge."
      }
    ]
  },
  {
    category: "Features",
    items: [
      {
        q: "Can I customize my AI agent's responses?",
        a: "Yes. You can manage its type, purpose, audience, allowed and blocked topics, do and don’t rules, uncertainty response, escalation message, response length, knowledge, identity, tone, appearance, and supporting links. Qlynk’s fixed platform safeguards remain active."
      },
      {
        q: "What can visitors do with my Qlynk Agent?",
        a: "Visitors can ask questions within the agent’s configured purpose, explore approved knowledge conversationally, follow relevant links, and use the contact, booking, support, or escalation paths you provide."
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
        q: "Can I control whether my Qlynk Agent is live?",
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
            Everything you need to know about creating and managing a focused Qlynk Agent.
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
          <h3 className="text-2xl font-bold text-white mb-4">Ready to create your Qlynk Agent?</h3>
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
