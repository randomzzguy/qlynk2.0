import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'AI Clone for Freelancers — Capture Leads While You Sleep | Qlynk',
  description: 'Create a personal AI agent that showcases your services, answers client questions, and books consultations 24/7.',
};

export default function ForFreelancers() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400 mb-8">
          For Freelancers & Consultants
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-8 tracking-tight">
          Capture Leads <br className="hidden md:block"/>While You Sleep
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          Your clients are looking for you at 2 AM. Your AI clone is awake. Qlynk creates a personal AI agent that showcases your services, answers client questions, and books consultations — 24/7.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>💬</span> Service Inquiries
            </h3>
            <p className="text-gray-400">Your AI explains what you do, your process, and your pricing automatically.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🎨</span> Portfolio Showcase
            </h3>
            <p className="text-gray-400">Visitors ask about specific projects and your AI shares relevant work instantly.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>📅</span> Booking Consultations
            </h3>
            <p className="text-gray-400">Qualified leads can schedule discovery calls directly without the back-and-forth.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🌙</span> After-Hours Capture
            </h3>
            <p className="text-gray-400">Don't lose leads because you were asleep. Wake up to warm prospects.</p>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-3xl p-12 max-w-3xl mx-auto">
          <p className="text-lg text-blue-200 mb-8 font-medium">
            Perfect for: Designers, developers, writers, consultants, photographers, marketers, and coaches.
          </p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Create Your Freelancer AI Clone →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
