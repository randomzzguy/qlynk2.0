import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { ArrowRight, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Qlynk Resources & Blog | AI Clone Guides & Insights',
  description: 'Learn about AI clones, how to create them, and why they\'re the future of personal professional presence.',
};

const resources = [
  {
    slug: 'what-is-an-ai-clone',
    title: 'What Is an AI Clone?',
    description: 'The complete guide to understanding personal AI agents and how they represent you online.',
    icon: Lightbulb,
    category: 'Guide',
    readTime: '5 min read',
    color: 'blue',
  },
  {
    slug: 'how-to-create-ai-clone',
    title: 'How to Create Your AI Clone',
    description: 'Step-by-step tutorial to build your personal AI agent in 5 minutes. No coding required.',
    icon: BookOpen,
    category: 'Tutorial',
    readTime: '5 min read',
    color: 'purple',
  },
  {
    slug: 'ai-clone-vs-chatbot',
    title: 'AI Clone vs Chatbot',
    description: 'Understanding the key differences between AI clones and traditional chatbots.',
    icon: HelpCircle,
    category: 'Comparison',
    readTime: '4 min read',
    color: 'orange',
  },
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center group">
              <Image src="/logoWhite.svg" alt="qlynk logo" width={100} height={40} priority />
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
              <ArrowRight size={16} className="rotate-180" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-6">
            Resources
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Learn About <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">AI Clones</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Guides, tutorials, and insights to help you understand and create your personal AI agent.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const Icon = resource.icon;
            const colorClasses = {
              blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
              purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
              orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400',
            };
            
            return (
              <Link
                key={resource.slug}
                href={`/blog/${resource.slug}`}
                className={`group block p-8 rounded-2xl bg-gradient-to-br ${colorClasses[resource.color]} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/30 ${resource.color === 'blue' ? 'text-blue-400' : resource.color === 'purple' ? 'text-purple-400' : 'text-orange-400'}`}>
                    {resource.category}
                  </span>
                  <Icon size={24} className="opacity-60" />
                </div>
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                  {resource.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{resource.readTime}</span>
                  <span className="text-sm font-medium text-white flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-10">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Your AI Clone?</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Put what you've learned into practice. Create your personal AI agent in less than 5 minutes.
            </p>
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-105"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
