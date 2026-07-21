import Image from 'next/image';
import Link from 'next/link';

export default function MarketingHeader() {
  return (
    <header className="border-b border-white/10 bg-gray-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Qlynk home">
          <Image src="/logoWhite.svg" alt="Qlynk AI" width={112} height={42} priority className="h-auto w-[112px]" />
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-3 sm:gap-6">
          <Link href="/solutions" className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-orange sm:block">
            Solutions
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-gray-300 transition-colors hover:text-orange">
            Pricing
          </Link>
          <Link href="/blog" className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-orange md:block">
            Resources
          </Link>
          <Link href="/auth/login" className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-orange sm:block">
            Log in
          </Link>
          <Link href="/auth/signup" className="rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c14f22]">
            Start Free
          </Link>
        </nav>
      </div>
    </header>
  );
}
