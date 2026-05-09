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
                alt="qlynk logo"
                width={120}
                height={48}
                className="group-hover:opacity-80 transition-opacity"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Create your personal AI clone in a blink. Scale your presence and engage visitors 24/7.
            </p>
          </div>

          {/* Links Cols */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/pricing" className="hover:text-[#f46530] transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-[#f46530] transition-colors">FAQ</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#f46530] transition-colors">Log In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-[#f46530] transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Use Cases</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/for-freelancers" className="hover:text-[#f46530] transition-colors">For Freelancers</Link></li>
              <li><Link href="/for-founders" className="hover:text-[#f46530] transition-colors">For Founders</Link></li>
              <li><Link href="/for-creators" className="hover:text-[#f46530] transition-colors">For Creators</Link></li>
              <li><Link href="/for-job-seekers" className="hover:text-[#f46530] transition-colors">For Job Seekers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/blog/what-is-an-ai-clone" className="hover:text-[#f46530] transition-colors">What is an AI Clone?</Link></li>
              <li><Link href="/blog/how-to-create-ai-clone" className="hover:text-[#f46530] transition-colors">How to Create an AI Clone</Link></li>
              <li><Link href="#" className="hover:text-[#f46530] transition-colors">AI Clone vs Chatbot</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} qlynk. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
