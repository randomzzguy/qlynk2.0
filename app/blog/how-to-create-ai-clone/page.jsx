import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'How to Create Your AI Clone in 5 Minutes | Qlynk',
  description: 'Step-by-step guide to creating your personal AI agent. Learn how to train your AI clone, customize its personality, and share it with the world.',
};

export default function HowToCreateAIClone() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 py-24 relative z-10">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block transition-colors">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert lg:prose-lg max-w-none">
          <header className="mb-16 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-400 mb-6">
              Tutorial
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6 tracking-tight leading-tight">
              How to Create Your AI Clone <br className="hidden md:block"/>in 5 Minutes
            </h1>
            <div className="text-gray-400 flex items-center justify-center gap-4 text-sm">
              <span>Step-by-Step Guide</span>
              <span>•</span>
              <span>Updated 2026</span>
            </div>
          </header>

          <div className="space-y-8 text-gray-300 text-lg leading-relaxed">
            <p className="text-xl text-gray-200">
              You've heard about AI clones. Digital versions of yourself that can answer questions, share your expertise, and engage visitors — all without you lifting a finger.
            </p>
            <p>
              But how do you actually <em>create</em> one?
            </p>
            <p>
              This guide walks you through the entire process, step by step. No technical skills required. No coding. You'll have a live AI clone in about five minutes.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 my-10">
              <h2 className="text-2xl font-semibold text-white mb-6">What You'll Need Before You Start</h2>
              <ul className="space-y-3 list-disc pl-6 marker:text-purple-500">
                <li>A bio or professional summary</li>
                <li>Your resume, CV, or list of skills and experience</li>
                <li>Any projects, portfolio items, or work samples you want to showcase</li>
                <li>(Optional) Documents, FAQs, or specific knowledge you want your AI to have</li>
              </ul>
              <p className="mt-6 text-gray-400 italic">Don't have everything perfectly organized? That's fine. You can always add more content later.</p>
            </div>

            <h2 className="text-3xl font-semibold text-white mt-12 mb-6">Step 1: Sign Up and Claim Your URL</h2>
            <p>
              Go to <Link href="/" className="text-blue-400 hover:text-blue-300 underline">qlynk.site</Link> and create your account.
            </p>
            <p>
              During signup, you'll choose your unique URL: <strong className="text-white">qlynk.site/yourname</strong>
            </p>
            <p>
              This is the link you'll share everywhere — social media, email signatures, business cards. Choose something professional and memorable. Your name is usually the best choice.
            </p>

            <h2 className="text-3xl font-semibold text-white mt-12 mb-6">Step 2: Upload Your Knowledge</h2>
            <p>This is where the magic happens. Your AI agent learns from the content you provide.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-4">Start with the basics:</h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Your professional bio (2-3 paragraphs)</li>
                  <li>Your current role and expertise areas</li>
                  <li>Key skills and technologies you work with</li>
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-4">Then add depth:</h3>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Upload your resume or CV</li>
                  <li>Add project descriptions and outcomes</li>
                  <li>Include documents representing your expertise</li>
                </ul>
              </div>
            </div>

            <p className="bg-blue-900/20 text-blue-200 p-4 rounded-lg border-l-4 border-blue-500 mt-6">
              <strong>Pro tip:</strong> Quality matters more than quantity. A well-written bio is worth more than a dump of random documents. Focus on the information you'd want your AI to share with visitors.
            </p>

            <h2 className="text-3xl font-semibold text-white mt-12 mb-6">Step 3: Customize Your AI's Personality</h2>
            <p>Your AI clone should feel like <em>you</em>, not a generic chatbot.</p>
            <ul className="space-y-4 list-none pl-0">
              <li className="flex gap-4"><span className="text-2xl">🎭</span> <div><strong className="text-white">Tone:</strong> Professional? Casual? Friendly? Technical?</div></li>
              <li className="flex gap-4"><span className="text-2xl">📝</span> <div><strong className="text-white">Response style:</strong> Concise or detailed? Formal or conversational?</div></li>
              <li className="flex gap-4"><span className="text-2xl">🛡️</span> <div><strong className="text-white">Boundaries:</strong> What should it redirect to you? What topics are off-limits?</div></li>
            </ul>

            <h2 className="text-3xl font-semibold text-white mt-12 mb-6">Step 4: Test Your AI Clone</h2>
            <p>Before going live, have a conversation with your own AI clone. Ask it:</p>
            <div className="bg-black border border-white/10 rounded-xl p-6 font-mono text-sm text-gray-300">
              <p className="mb-2">&gt; "What do you do?"</p>
              <p className="mb-2">&gt; "What's your experience with [your specialty]?"</p>
              <p className="mb-2">&gt; "How can I contact you?"</p>
              <p>&gt; "What projects have you worked on?"</p>
            </div>
            <p className="mt-4">See how it responds. If something feels off, go back and adjust your training content. This is an iterative process.</p>

            <h2 className="text-3xl font-semibold text-white mt-12 mb-6">Step 5: Share Your Link</h2>
            <p>Your AI clone is live. Now get it in front of people. Drop the link in your Twitter bio, LinkedIn featured section, email signature, and portfolio.</p>

            <h2 className="text-3xl font-semibold text-white mt-12 mb-6">After Launch: How to Improve Your AI Clone</h2>
            <div className="space-y-6">
              <div>
                <strong className="text-white text-lg block mb-1">Monitor Conversations</strong>
                <p>Check your dashboard regularly. See what visitors are asking. Are there questions your AI can't answer? Add that knowledge.</p>
              </div>
              <div>
                <strong className="text-white text-lg block mb-1">Update Your Content</strong>
                <p>Got a new project? Changed roles? Learned a new skill? Update your AI's knowledge base so it stays current.</p>
              </div>
            </div>

            <hr className="border-white/10 my-12" />

            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-white/10 rounded-3xl p-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Yours?</h2>
              <p className="text-gray-300 mb-8 max-w-lg mx-auto">Creating your AI clone takes less than five minutes. No credit card required.</p>
              <Link href="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-300 hover:scale-105">
                Create Your AI Clone Free →
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
