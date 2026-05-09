import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'AI Clone for Founders — Scale Your Presence | Qlynk',
  description: 'Create an AI agent that answers investor questions, handles customer inquiries, and scales your startup presence.',
};

export default function ForFounders() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-400 mb-8">
          For Startup Founders
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-8 tracking-tight">
          Scale Your Presence <br className="hidden md:block"/>Without Scaling Your Team
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          Investors, customers, press, partners — everyone wants a piece of you. Your AI clone handles the first conversation so you can focus on building.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>📈</span> Investor Inquiries
            </h3>
            <p className="text-gray-400">Your AI shares your pitch, traction, and vision with curious investors instantly.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🤝</span> Customer Questions
            </h3>
            <p className="text-gray-400">Handle product FAQs and initial support without hiring a massive support team.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🗞️</span> Press & Media
            </h3>
            <p className="text-gray-400">Journalists get instant background information and quotes about your company.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🔗</span> Partnership Requests
            </h3>
            <p className="text-gray-400">Initial qualification of partners and vendors before you get personally involved.</p>
          </div>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500/20 rounded-3xl p-12 max-w-3xl mx-auto">
          <p className="text-lg text-purple-200 mb-8 font-medium">
            Perfect for: Startup founders, solo founders, bootstrapped builders, and indie hackers.
          </p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Create Your Founder AI Clone →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
