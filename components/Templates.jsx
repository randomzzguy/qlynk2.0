// components/Templates.jsx
import Image from 'next/image';
import { Mail, ExternalLink } from 'lucide-react';

// 1) Noir – cinematic, high-contrast dark luxury
export const NoirTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-black flex items-center justify-center text-neutral-500">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-12 items-end">
          <div className="md:col-span-2">
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter leading-none">{data.name}</h1>
            {data.profession && <p className="text-xl text-neutral-300 mt-4">{data.profession}</p>}
            {data.tagline && <p className="text-neutral-400 italic mt-2">&ldquo;{data.tagline}&rdquo;</p>}
          </div>
          {data.profileImage && (
            <div className="md:col-span-1">
              <div className="relative w-full aspect-square rounded-2xl border-2 border-neutral-800 overflow-hidden">
                <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
              </div>
            </div>
          )}
        </div>
        {data.bio && <p className="text-neutral-300 leading-relaxed mt-12 max-w-3xl">{data.bio}</p>}
        {data.links && data.links.length > 0 && (
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {data.links.map((link, i) => (
              <a key={i} href={link.url} className="group relative block p-6 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{link.title}</h3>
                    {link.description && <p className="text-neutral-400 text-sm mt-1">{link.description}</p>}
                  </div>
                  <ExternalLink className="text-neutral-500 group-hover:text-white transition" size={18} />
                </div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-8">
          {data.cta && (
            <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition">
              {data.cta}
            </button>
          )}
          <div className="flex gap-4">
            {data.socialLinks?.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.url} className="text-neutral-400 hover:text-white transition">
                  <Icon size={22} />
                </a>
              );
            })}
            {data.email && (
              <a href={`mailto:${data.email}`} className="text-neutral-400 hover:text-white transition">
                <Mail size={22} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2) Zine – chaotic, playful, collage-style
export const ZineTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-yellow-50 flex items-center justify-center text-yellow-700">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-yellow-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform">
              {data.profileImage && (
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-6 border-4 border-purple-400">
                  <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
                </div>
              )}
              <h1 className="text-3xl font-black text-purple-900 mb-2">{data.name}</h1>
              {data.profession && <p className="text-purple-700 font-semibold mb-3">{data.profession}</p>}
              {data.tagline && <p className="text-purple-600 italic">&ldquo;{data.tagline}&rdquo;</p>}
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            {data.bio && (
              <div className="bg-orange-100 rounded-2xl p-6 transform rotate-1 hover:rotate-0 transition-transform">
                <h2 className="text-xl font-bold text-orange-900 mb-2">About</h2>
                <p className="text-orange-800">{data.bio}</p>
              </div>
            )}
            {data.links && data.links.length > 0 && (
              <div className="space-y-4">
                {data.links.map((link, i) => (
                  <a key={i} href={link.url} className={`block p-4 rounded-xl transform ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'} hover:rotate-0 transition-transform shadow-lg ${i % 2 === 0 ? 'bg-pink-200' : 'bg-purple-200'}`}>
                    <h3 className={`font-bold ${i % 2 === 0 ? 'text-pink-900' : 'text-purple-900'}`}>{link.title}</h3>
                    {link.description && <p className={`text-sm ${i % 2 === 0 ? 'text-pink-700' : 'text-purple-700'}`}>{link.description}</p>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-12 text-center">
          {data.cta && (
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105">
              {data.cta}
            </button>
          )}
          <div className="flex justify-center gap-6 mt-8">
            {data.socialLinks?.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.url} className="text-purple-600 hover:text-purple-800 transition-colors">
                  <Icon size={24} />
                </a>
              );
            })}
            {data.email && (
              <a href={`mailto:${data.email}`} className="text-purple-600 hover:text-purple-800 transition-colors">
                <Mail size={24} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3) Paper – ultra-minimal, print-like
export const PaperTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-400">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <header className="border-b border-black pb-8">
          <h1 className="text-5xl font-light tracking-tight">{data.name}</h1>
          {data.profession && <p className="text-lg text-gray-600 mt-2">{data.profession}</p>}
          {data.tagline && <p className="text-gray-500 italic mt-1">&ldquo;{data.tagline}&rdquo;</p>}
        </header>
        <main className="mt-12 space-y-16">
          {data.bio && <p className="text-gray-700 leading-loose max-w-prose">{data.bio}</p>}
          {data.links && data.links.length > 0 && (
            <section>
              <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-6">Links</h2>
              <ul className="space-y-4">
                {data.links.map((link, i) => (
                  <li key={i}>
                    <a href={link.url} className="group flex items-center justify-between border-b border-gray-200 pb-3 hover:border-black transition">
                      <div>
                        <h3 className="text-lg font-medium">{link.title}</h3>
                        {link.description && <p className="text-sm text-gray-500">{link.description}</p>}
                      </div>
                      <ExternalLink className="text-gray-400 group-hover:text-black transition" size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
        <footer className="mt-24 pt-8 border-t border-black flex items-center justify-between">
          {data.cta && (
            <button className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-white transition">
              {data.cta}
            </button>
          )}
          <div className="flex gap-4">
            {data.socialLinks?.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.url} className="text-gray-500 hover:text-black transition">
                  <Icon size={20} />
                </a>
              );
            })}
            {data.email && (
              <a href={`mailto:${data.email}`} className="text-gray-500 hover:text-black transition">
                <Mail size={20} />
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

// 4) Neon – dark mode with glowing accents
export const NeonTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="relative p-10 rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl shadow-cyan-500/10">
          {data.profileImage && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-cyan-400 shadow-lg shadow-cyan-400/30 overflow-hidden">
              <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
            </div>
          )}
          <div className="text-center mt-10">
            <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">{data.name}</h1>
            {data.profession && <p className="text-xl text-gray-300 mt-3">{data.profession}</p>}
            {data.tagline && <p className="text-gray-400 italic mt-2">&ldquo;{data.tagline}&rdquo;</p>}
          </div>
        </div>
        {data.bio && <p className="text-gray-300 leading-relaxed mt-12 max-w-3xl mx-auto text-center">{data.bio}</p>}
        {data.links && data.links.length > 0 && (
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {data.links.map((link, i) => (
              <a key={i} href={link.url} className="group relative block p-6 rounded-2xl border border-gray-800 bg-gray-900 hover:border-cyan-400 transition-all shadow-lg hover:shadow-cyan-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-300">{link.title}</h3>
                    {link.description && <p className="text-gray-400 text-sm mt-1">{link.description}</p>}
                  </div>
                  <ExternalLink className="text-gray-500 group-hover:text-cyan-400 transition" size={18} />
                </div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-8">
          {data.cta && (
            <button className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/40 transition">
              {data.cta}
            </button>
          )}
          <div className="flex gap-4">
            {data.socialLinks?.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.url} className="text-gray-500 hover:text-cyan-400 transition">
                  <Icon size={22} />
                </a>
              );
            })}
            {data.email && (
              <a href={`mailto:${data.email}`} className="text-gray-500 hover:text-cyan-400 transition">
                <Mail size={22} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5) Ocean – calm gradients and soft curves
export const OceanTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center text-blue-300">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 text-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative">
          {data.profileImage && (
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full overflow-hidden shadow-2xl border-8 border-white">
              <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
            </div>
          )}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 pl-32 shadow-xl shadow-blue-500/10">
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">{data.name}</h1>
            {data.profession && <p className="text-lg text-blue-600 mt-2">{data.profession}</p>}
            {data.tagline && <p className="text-slate-500 italic mt-1">&ldquo;{data.tagline}&rdquo;</p>}
          </div>
        </div>
        {data.bio && <p className="text-slate-600 leading-relaxed mt-12 max-w-3xl">{data.bio}</p>}
        {data.links && data.links.length > 0 && (
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {data.links.map((link, i) => (
              <a key={i} href={link.url} className="group block p-6 rounded-2xl bg-white/60 backdrop-blur-lg border border-blue-100 hover:border-blue-300 transition shadow-lg hover:shadow-blue-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{link.title}</h3>
                    {link.description && <p className="text-slate-500 text-sm mt-1">{link.description}</p>}
                  </div>
                  <ExternalLink className="text-blue-300 group-hover:text-blue-500 transition" size={18} />
                </div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-8">
          {data.cta && (
            <button className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              {data.cta}
            </button>
          )}
          <div className="flex gap-4">
            {data.socialLinks?.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={s.url} className="text-blue-400 hover:text-blue-600 transition">
                  <Icon size={22} />
                </a>
              );
            })}
            {data.email && (
              <a href={`mailto:${data.email}`} className="text-blue-400 hover:text-blue-600 transition">
                <Mail size={22} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 6) Premium: Slate – refined corporate feel (paid unlock)
export const SlateTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="md:col-span-1 bg-slate-900 text-white p-12 flex flex-col justify-between">
              <div>
                {data.profileImage && (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-slate-700">
                    <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
                  </div>
                )}
                <h1 className="text-4xl font-bold">{data.name}</h1>
                {data.profession && <p className="text-slate-300 mt-2">{data.profession}</p>}
              </div>
              <div className="mt-8">
                {data.socialLinks?.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <a key={i} href={s.url} className="inline-block mr-4 text-slate-400 hover:text-white transition">
                      <Icon size={20} />
                    </a>
                  );
                })}
                {data.email && (
                  <a href={`mailto:${data.email}`} className="inline-block text-slate-400 hover:text-white transition">
                    <Mail size={20} />
                  </a>
                )}
              </div>
            </div>
            <div className="md:col-span-2 p-12">
              {data.tagline && <p className="text-slate-500 italic mb-8">&ldquo;{data.tagline}&rdquo;</p>}
              {data.bio && <p className="text-slate-700 leading-relaxed mb-12">{data.bio}</p>}
              {data.links && data.links.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  {data.links.map((link, i) => (
                    <a key={i} href={link.url} className="group block p-6 rounded-2xl border border-slate-200 hover:border-slate-400 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{link.title}</h3>
                          {link.description && <p className="text-slate-500 text-sm mt-1">{link.description}</p>}
                        </div>
                        <ExternalLink className="text-slate-400 group-hover:text-slate-700 transition" size={18} />
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {data.cta && (
                <div className="mt-12">
                  <button className="px-8 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition">
                    {data.cta}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Re-export old names for compatibility until editor is updated
export const ProfessionalTemplate = NoirTemplate;
export const CreativeTemplate = ZineTemplate;
export const MinimalistTemplate = PaperTemplate;
export const DarkTemplate = NeonTemplate;
export const VibrantTemplate = OceanTemplate;
export const MonoPressTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-400">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight">{data.name}</h1>
        {data.profession && <p className="text-lg text-neutral-600 mt-2 font-serif">{data.profession}</p>}
        {data.tagline && <p className="text-neutral-500 italic mt-2 font-serif">&ldquo;{data.tagline}&rdquo;</p>}
        {data.profileImage && (
          <div className="relative mt-8 w-40 h-40 rounded-xl border overflow-hidden">
            <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
          </div>
        )}
        {data.bio && <p className="text-neutral-700 leading-relaxed mt-10 font-serif">{data.bio}</p>}
        {data.links && data.links.length > 0 && (
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {data.links.map((link, i) => (
              <a key={i} href={link.url} className="group block p-6 rounded-xl border hover:bg-neutral-50 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-serif">{link.title}</h3>
                    {link.description && <p className="text-neutral-500 text-sm mt-1 font-serif">{link.description}</p>}
                  </div>
                  <ExternalLink className="text-neutral-400 group-hover:text-neutral-900 transition" size={18} />
                </div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-16 flex items-center justify-between">
          {data.cta && (
            <button className="px-6 py-3 border rounded-full hover:bg-black hover:text-white transition font-serif">{data.cta}</button>
          )}
          <div className="flex gap-4">
            {data.socialLinks?.map((s, i) => { const Icon = s.icon; return (<a key={i} href={s.url} className="text-neutral-500 hover:text-black transition"><Icon size={20} /></a>); })}
            {data.email && (<a href={`mailto:${data.email}`} className="text-neutral-500 hover:text-black transition"><Mail size={20} /></a>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuroraTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 flex items-center justify-center text-violet-400">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 text-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 shadow-xl">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">{data.name}</h1>
          {data.profession && <p className="text-lg text-violet-600 mt-2">{data.profession}</p>}
          {data.tagline && <p className="text-slate-600 italic mt-1">&ldquo;{data.tagline}&rdquo;</p>}
          {data.bio && <p className="text-slate-700 leading-relaxed mt-8">{data.bio}</p>}
          {data.links && data.links.length > 0 && (
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              {data.links.map((link, i) => (
                <a key={i} href={link.url} className="group block p-6 rounded-2xl bg-white/60 backdrop-blur border hover:border-violet-300 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{link.title}</h3>
                      {link.description && <p className="text-slate-500 text-sm mt-1">{link.description}</p>}
                    </div>
                    <ExternalLink className="text-violet-300 group-hover:text-violet-600 transition" size={18} />
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="mt-12 flex items-center justify-between">
            {data.cta && (<button className="px-8 py-3 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition">{data.cta}</button>)}
            <div className="flex gap-4">
              {data.socialLinks?.map((s, i) => { const Icon = s.icon; return (<a key={i} href={s.url} className="text-violet-500 hover:text-violet-700 transition"><Icon size={22} /></a>); })}
              {data.email && (<a href={`mailto:${data.email}`} className="text-violet-500 hover:text-violet-700 transition"><Mail size={22} /></a>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BrutalistTemplate = ({ data }) => {
  if (!data.name) return <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-500">Start filling the form to see your page…</div>;
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="border-4 border-black rounded-xl p-10 bg-white">
          <h1 className="text-5xl font-black tracking-tighter">{data.name}</h1>
          {data.profession && <p className="text-lg mt-2">{data.profession}</p>}
          {data.tagline && <p className="mt-2 italic">&ldquo;{data.tagline}&rdquo;</p>}
          {data.bio && <p className="mt-8 leading-relaxed">{data.bio}</p>}
          {data.links && data.links.length > 0 && (
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              {data.links.map((link, i) => (
                <a key={i} href={link.url} className="group block p-6 rounded-xl border-4 border-black hover:bg-neutral-100 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black">{link.title}</h3>
                      {link.description && <p className="text-neutral-700 text-sm mt-1">{link.description}</p>}
                    </div>
                    <ExternalLink className="text-neutral-400 group-hover:text-black transition" size={18} />
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="mt-12 flex items-center justify-between">
            {data.cta && (<button className="px-8 py-3 rounded-md bg-black text-white font-bold hover:opacity-90 transition">{data.cta}</button>)}
            <div className="flex gap-4">
              {data.socialLinks?.map((s, i) => { const Icon = s.icon; return (<a key={i} href={s.url} className="text-neutral-600 hover:text-black transition"><Icon size={22} /></a>); })}
              {data.email && (<a href={`mailto:${data.email}`} className="text-neutral-600 hover:text-black transition"><Mail size={22} /></a>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Import premium templates (will be available only for pro users)
 

export const templates = {
  professional: MonoPressTemplate,
  creative: AuroraTemplate,
  minimalist: BrutalistTemplate,
  dark: DarkTemplate,
  vibrant: VibrantTemplate,
};
