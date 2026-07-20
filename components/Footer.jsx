import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="py-16 bg-[#0c0c12] text-gray-400 relative z-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6 group">
              <Image
                src="/logoWhite.svg"
                alt="Qlynk AI logo"
                width={120}
                height={48}
                className="group-hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Turn your approved knowledge into a trusted AI agent you can control and share through a simple Qlynk link.
            </p>
          </div>

          {/* Links Cols */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/ai-agent" className="hover:text-[#f46530] transition-colors">AI Agent Platform</Link></li>
              <li><Link href="/solutions" className="hover:text-[#f46530] transition-colors">All Solutions</Link></li>
              <li><Link href="/features/knowledge-base" className="hover:text-[#f46530] transition-colors">Knowledge Base</Link></li>
              <li><Link href="/features/security" className="hover:text-[#f46530] transition-colors">Scope & Controls</Link></li>
              <li><Link href="/personal-ai" className="hover:text-[#f46530] transition-colors">Personal AI</Link></li>
              <li><Link href="/pricing" className="hover:text-[#f46530] transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-[#f46530] transition-colors">FAQ</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#f46530] transition-colors">Log In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-[#f46530] transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Popular Solutions</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/solutions/ai-agent-builder" className="hover:text-[#f46530] transition-colors">AI Agent Builder</Link></li>
              <li><Link href="/solutions/personal-ai-assistant" className="hover:text-[#f46530] transition-colors">Personal AI Assistant</Link></li>
              <li><Link href="/solutions/business-ai-assistant" className="hover:text-[#f46530] transition-colors">Business AI Assistant</Link></li>
              <li><Link href="/solutions/ai-customer-support" className="hover:text-[#f46530] transition-colors">AI Customer Support</Link></li>
              <li><Link href="/solutions/ai-property-assistant" className="hover:text-[#f46530] transition-colors">AI Property Assistant</Link></li>
              <li><Link href="/solutions/ai-sop-assistant" className="hover:text-[#f46530] transition-colors">AI SOP Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/blog" className="hover:text-[#f46530] transition-colors">All Resources</Link></li>
              <li><Link href="/docs" className="hover:text-[#f46530] transition-colors">Documentation</Link></li>
              <li><Link href="/blog/what-is-an-ai-agent" className="hover:text-[#f46530] transition-colors">What Is an AI Agent?</Link></li>
              <li><Link href="/blog/ai-agent-vs-ai-chatbot" className="hover:text-[#f46530] transition-colors">AI Agent vs Chatbot</Link></li>
              <li><Link href="/blog/rag-explained" className="hover:text-[#f46530] transition-colors">RAG Explained</Link></li>
              <li><Link href="/compare" className="hover:text-[#f46530] transition-colors">Platform Comparisons</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} qlynk. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/press" className="hover:text-white transition-colors">Press Kit</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
