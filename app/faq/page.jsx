import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'FAQ - Qlynk | Frequently Asked Questions',
  description: 'Find answers to common questions about Qlynk, the personal AI agent platform. Learn how to create your AI clone, customize responses, and pricing.',
};

export default function FAQPage() {
  const faqs = [
    {
      category: "General",
      items: [
        {
          q: "What is Qlynk?",
          a: "Qlynk lets you create a personal AI agent (an \"AI clone\") trained on your knowledge and expertise. Visitors can chat with your AI to learn about you, ask questions, and book meetings — available 24/7 at your personal qlynk.site/username link."
        },
        {
          q: "How does Qlynk work?",
          a: "Three simple steps:\n1. Sign up and claim your unique qlynk.site/username URL\n2. Train your agent by uploading your bio, resume, projects, and documents\n3. Share your link — visitors chat with your AI while you sleep, work, or play"
        },
        {
          q: "How much does Qlynk cost?",
          a: "Qlynk offers a 14-day free trial with no charge today. After the trial, choose from flexible plans based on your needs."
        },
        {
          q: "How long does setup take?",
          a: "Most users have their AI clone live in under 5 minutes. Just sign up, upload your content, and share your link."
        }
      ]
    },
    {
      category: "Features",
      items: [
        {
          q: "Can I customize my AI agent's responses?",
          a: "Yes! You can customize your agent's personality, responses, and appearance to match your personal brand. You control what it knows and how it responds."
        },
        {
          q: "What can visitors do with my AI clone?",
          a: "Visitors can:\n• Ask questions about your work, skills, and experience\n• Learn about your services or products\n• Request information about specific projects\n• Book meetings or consultations\n• Get instant answers 24/7"
        },
        {
          q: "Can I see what people are asking?",
          a: "Yes. Qlynk provides a dashboard with conversation insights, popular topics, and engagement metrics. You'll know exactly what visitors are interested in."
        },
        {
          q: "Can I update my AI agent's knowledge?",
          a: "Absolutely. You can add, edit, or remove content at any time. Your AI agent learns from every update."
        }
      ]
    },
    {
      category: "Privacy & Security",
      items: [
        {
          q: "Is my data safe?",
          a: "Yes. You control exactly what information your AI agent has access to. You upload only what you want it to know, and you can update or remove content at any time."
        },
        {
          q: "Can I control what my AI clone says?",
          a: "Yes. You set the boundaries for your AI agent's responses. It only shares information you've provided and can be configured to redirect certain topics to you directly."
        },
        {
          q: "Will my AI clone share private information?",
          a: "No. Your AI agent only has access to information you explicitly provide. It won't share anything you haven't approved."
        }
      ]
    },
    {
      category: "Use Cases",
      items: [
        {
          q: "Who is Qlynk for?",
          a: "Qlynk is built for:\n• Freelancers — showcase services and capture leads 24/7\n• Founders — answer investor and customer questions automatically\n• Creators — engage your audience with personalized interactions\n• Job seekers — stand out with an interactive resume\n• Professionals — let your AI handle initial inquiries"
        },
        {
          q: "Can I use Qlynk for my business?",
          a: "Qlynk is designed for personal branding and individual professionals. For team or enterprise use, contact us for custom solutions."
        },
        {
          q: "Can I share my Qlynk link on social media?",
          a: "Absolutely. Your qlynk.site/username link works everywhere — Twitter, LinkedIn, Instagram, email signatures, business cards, and more."
        }
      ]
    },
    {
      category: "Technical",
      items: [
        {
          q: "Does Qlynk work on mobile?",
          a: "Yes. Your AI clone works perfectly on any device — desktop, tablet, or mobile."
        },
        {
          q: "What languages does Qlynk support?",
          a: "Qlynk supports multiple languages. Your AI agent can communicate in the language your visitors prefer."
        },
        {
          q: "Can I use my own domain?",
          a: "Custom domain support is available on premium plans. You can use your own domain instead of qlynk.site/username."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 relative overflow-hidden">
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
