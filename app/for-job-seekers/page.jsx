import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Stand Out — Let Recruiters Talk to Your AI | Qlynk',
  description: 'Create an interactive AI resume that answers recruiter questions and showcases why you are the right fit.',
};

export default function ForJobSeekers() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-emerald-400 mb-8">
          For Job Seekers & Professionals
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 mb-8 tracking-tight">
          Stand Out. <br className="hidden md:block"/>Let Recruiters Talk to You.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          Resumes get scanned for 6 seconds. Your AI clone keeps recruiters engaged for minutes, explaining your experience interactively.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🎮</span> Interactive Experience
            </h3>
            <p className="text-gray-400">Recruiters explore your background dynamically instead of reading a static PDF.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🧠</span> Skill Deep-Dives
            </h3>
            <p className="text-gray-400">Your AI explains your expertise, past projects, and technical skills with context.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🎭</span> Culture Fit
            </h3>
            <p className="text-gray-400">Share your work style, values, and personality conversationally before the first interview.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>⭐</span> Unfair Advantage
            </h3>
            <p className="text-gray-400">99% of applicants submit a PDF. You submit a conversation. Be the candidate they remember.</p>
          </div>
        </div>
        
        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-3xl p-12 max-w-3xl mx-auto">
          <p className="text-lg text-emerald-200 mb-8 font-medium">
            Perfect for: Tech professionals, designers, marketers, career changers, and recent graduates.
          </p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Create Your AI Resume →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
