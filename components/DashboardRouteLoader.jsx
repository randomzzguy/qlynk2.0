import Image from 'next/image';

export default function DashboardRouteLoader({ label = 'Loading your workspace…' }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center text-center">
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border border-orange/20 bg-orange/[0.04] shadow-[0_0_45px_rgba(244,101,48,0.16)]" />
        <div className="absolute inset-1 animate-spin rounded-full border-2 border-white/10 border-t-orange motion-reduce:animate-none" />
        <div className="absolute inset-3 animate-[spin_1.8s_linear_infinite_reverse] rounded-full border border-white/5 border-b-[#2AB59E] motion-reduce:animate-none" />
        <div className="absolute inset-5 flex items-center justify-center rounded-full bg-[#17171f] shadow-inner shadow-black/40">
          <Image src="/assets/iconWhite.svg" alt="" width={24} height={24} priority />
        </div>
      </div>
      <p className="mt-5 text-sm font-black tracking-wide text-white">{label}</p>
      <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange motion-reduce:animate-none"
            style={{ animationDelay: `${dot * 140}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Please wait while the dashboard page loads.</span>
    </div>
  );
}
