import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'AI Clone for Creators — Engage Every Follower | Qlynk',
  description: 'Create an AI agent that engages your audience, answers questions, and recommends your content in your own voice.',
};

export default function ForCreators() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-[150px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto px-6 py-32 relative z-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-pink-400 mb-8">
          For Content Creators
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-orange-400 mb-8 tracking-tight">
          Engage Every Follower <br className="hidden md:block"/>Personally
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          You have 10,000 followers. You can't reply to all of them. Your AI clone can. Qlynk creates a personal AI agent that engages your audience in your voice.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>❤️</span> Audience Engagement
            </h3>
            <p className="text-gray-400">Every single follower gets a personal interaction, building a stronger connection.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>📺</span> Content Recommendations
            </h3>
            <p className="text-gray-400">Your AI suggests relevant videos, posts, and products based on what they ask.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>❓</span> FAQ Handling
            </h3>
            <p className="text-gray-400">"What gear do you use?" and "Where is this from?" get answered instantly.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span>🌍</span> Community Building
            </h3>
            <p className="text-gray-400">Provide a scaled personal touch that feels authentic and keeps fans engaged.</p>
          </div>
        </div>
        
        <div className="bg-pink-900/20 border border-pink-500/20 rounded-3xl p-12 max-w-3xl mx-auto">
          <p className="text-lg text-pink-200 mb-8 font-medium">
            Perfect for: YouTubers, podcasters, writers, influencers, educators, and artists.
          </p>
          <Link href="/auth/signup" className="inline-block px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Create Your Creator AI Clone →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
