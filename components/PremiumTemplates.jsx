"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, ExternalLink, Sparkles, Zap, Code, Palette } from 'lucide-react';

class Particle {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
    this.opacity = Math.random() * 0.5 + 0.5;
    this.color = `hsl(${Math.random() * 60 + 200}, 70%, 70%)`;
  }

  update(canvasWidth, canvasHeight) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
    if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fill();
  }
}

// Cosmic Flow Theme - 3D Space with Particle Constellations
export const CosmicFlowTheme = ({ data }) => {
  const canvasRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 150;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(100, 149, 237, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    }
  }, []);

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (!data.name) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <p className="text-white/60">Start filling the form to see your cosmic page...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden" onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-slow" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-16"
        >
          {data.profileImage && (
            <motion.div 
              className="inline-block relative mb-8"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400/50 shadow-2xl shadow-cyan-500/50 relative">
                <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
              </div>
              <motion.div 
                className="absolute -inset-2 rounded-full border-2 border-cyan-400/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}
          
          <motion.h1 
            className="text-6xl font-black text-white mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            style={{
              transform: `translate(${(mousePosition.x - viewport.w / 2) * 0.02}px, ${(mousePosition.y - viewport.h / 2) * 0.02}px)`
            }}
          >
            {data.name}
          </motion.h1>
          
          {data.profession && (
            <motion.p 
              className="text-2xl text-cyan-300 font-bold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {data.profession}
            </motion.p>
          )}
          
          {data.tagline && (
            <motion.p 
              className="text-xl text-white/80 italic max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              &quot;{data.tagline}&quot;
            </motion.p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {data.bio && (
            <motion.div 
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={24} />
                About Me
              </h2>
              <p className="text-white/80 leading-relaxed">{data.bio}</p>
            </motion.div>
          )}

          <motion.div 
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="text-purple-400" size={24} />
              Connect
            </h2>
            {data.email && (
              <p className="text-white/80 mb-4 flex items-center gap-2">
                <Mail size={18} />
                {data.email}
              </p>
            )}
            {data.socialLinks && (
              <div className="flex gap-4">
                {data.socialLinks.map((social, i) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={i}
                      href={social.url}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="text-white" size={20} />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {data.links && data.links.length > 0 && (
          <motion.div 
            className="grid md:grid-cols-2 gap-6 mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            {data.links.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1 }}
              >
                <h3 className="font-bold text-white text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                  {link.title}
                </h3>
                {link.description && (
                  <p className="text-white/70 text-sm">{link.description}</p>
                )}
                <ExternalLink className="text-white/40 group-hover:text-cyan-400 transition-colors mt-2" size={16} />
              </motion.a>
            ))}
          </motion.div>
        )}

        {data.cta && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
          >
            <motion.button
              className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-12 py-4 rounded-full font-bold text-xl shadow-2xl shadow-purple-500/50"
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 30px rgba(139, 69, 19, 0.6)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {data.cta}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Glass Morphism Theme - Advanced Glass Effects
export const GlassMorphismTheme = ({ data }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!data.name) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
      <p className="text-slate-400">Start filling the form to see your glass page...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div 
        className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-30"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute bottom-20 right-20 w-80 h-80 bg-pink-300 rounded-full blur-3xl opacity-30"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          {data.profileImage && (
            <motion.div 
              className="inline-block mb-8"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/50 shadow-2xl relative backdrop-blur-sm bg-white/20">
                <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full" />
              </div>
            </motion.div>
          )}
          
          <motion.h1 
            className="text-6xl font-black mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {data.name}
          </motion.h1>
          
          {data.profession && (
            <motion.p 
              className="text-2xl text-purple-600 font-bold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {data.profession}
            </motion.p>
          )}
          
          {data.tagline && (
            <motion.p 
              className="text-xl text-slate-600 italic max-w-2xl mx-auto backdrop-blur-sm bg-white/30 rounded-2xl p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              &quot;{data.tagline}&quot;
            </motion.p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {data.bio && (
            <motion.div 
              className="backdrop-blur-lg bg-white/30 rounded-3xl p-8 border border-white/50 shadow-2xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <Palette className="text-purple-600" size={24} />
                About
              </h2>
              <p className="text-slate-700 leading-relaxed">{data.bio}</p>
            </motion.div>
          )}

          <motion.div 
            className="backdrop-blur-lg bg-white/30 rounded-3xl p-8 border border-white/50 shadow-2xl"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Code className="text-purple-600" size={24} />
              Connect
            </h2>
            {data.email && (
              <p className="text-slate-700 mb-4 flex items-center gap-2">
                <Mail size={18} />
                {data.email}
              </p>
            )}
            {data.socialLinks && (
              <div className="flex gap-4">
                {data.socialLinks.map((social, i) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={i}
                      href={social.url}
                      className="backdrop-blur-lg bg-white/40 hover:bg-white/60 p-3 rounded-full transition-all border border-white/50"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="text-purple-600" size={20} />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {data.links && data.links.length > 0 && (
          <motion.div 
            className="grid md:grid-cols-2 gap-6 mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            {data.links.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                className="group backdrop-blur-lg bg-white/40 rounded-2xl p-6 border border-white/50 hover:border-purple-400/50 transition-all shadow-xl hover:shadow-2xl"
                whileHover={{ scale: 1.05, y: -8 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
              >
                <h3 className="font-bold text-purple-900 text-lg mb-2 group-hover:text-purple-700 transition-colors">
                  {link.title}
                </h3>
                {link.description && (
                  <p className="text-slate-600 text-sm">{link.description}</p>
                )}
                <ExternalLink className="text-purple-400 group-hover:text-purple-600 transition-colors mt-2" size={16} />
              </motion.a>
            ))}
          </motion.div>
        )}

        {data.cta && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
          >
            <motion.button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-full font-bold text-xl shadow-2xl shadow-purple-500/50 backdrop-blur-sm"
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 40px rgba(147, 51, 234, 0.6)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {data.cta}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Neon City Theme - Cyberpunk Aesthetic
export const NeonCityTheme = ({ data }) => {
  const [glitchText, setGlitchText] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (data.name) {
      const glitchInterval = setInterval(() => {
        if (Math.random() > 0.95) {
          setIsGlitching(true);
          const glitched = data.name.split('').map(char => 
            Math.random() > 0.8 ? String.fromCharCode(33 + Math.random() * 94) : char
          ).join('');
          setGlitchText(glitched);
          setTimeout(() => {
            setIsGlitching(false);
            setGlitchText('');
          }, 200);
        }
      }, 100);

      return () => clearInterval(glitchInterval);
    }
  }, [data.name]);

  if (!data.name) return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20" />
      <p className="text-cyan-400/60">Initializing cyberpunk matrix...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent" 
             style={{
               backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
               backgroundSize: '50px 50px',
               animation: 'grid-scroll 20s linear infinite'
             }} />
      </div>

      {/* Neon glow effects */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500 rounded-full blur-3xl opacity-20"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {data.profileImage && (
            <motion.div 
              className="inline-block mb-8 relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400 relative">
                <Image src={data.profileImage} alt={data.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-pink-500/20" />
              </div>
              <motion.div 
                className="absolute -inset-2 rounded-full border-2 border-cyan-400"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(6, 182, 212, 0.5)",
                    "0 0 40px rgba(6, 182, 212, 0.8)",
                    "0 0 20px rgba(6, 182, 212, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
          
          <motion.h1 
            className={`text-6xl font-black mb-4 ${isGlitching ? 'text-red-500' : 'text-cyan-400'} font-mono`}
            style={{
              textShadow: isGlitching ? 'none' : '0 0 20px rgba(6, 182, 212, 0.8)',
              filter: isGlitching ? 'blur(1px)' : 'none'
            }}
          >
            {isGlitching ? glitchText : data.name}
          </motion.h1>
          
          {data.profession && (
            <motion.p 
              className="text-2xl text-pink-400 font-bold mb-6 font-mono"
              style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}
              animate={{
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              {data.profession}
            </motion.p>
          )}
          
          {data.tagline && (
            <motion.p 
              className="text-xl text-cyan-300 italic max-w-2xl mx-auto font-mono"
              style={{ textShadow: '0 0 5px rgba(6, 182, 212, 0.6)' }}
            >
              &quot;{data.tagline}&quot;
            </motion.p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {data.bio && (
            <motion.div 
              className="bg-black/80 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/50 shadow-2xl shadow-cyan-500/20"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)"
              }}
            >
              <h2 className="text-2xl font-bold text-cyan-400 mb-4 font-mono flex items-center gap-2">
                <Code className="text-cyan-400" size={24} />
                SYSTEM_INFO
              </h2>
              <p className="text-cyan-100 leading-relaxed font-mono">{data.bio}</p>
            </motion.div>
          )}

          <motion.div 
            className="bg-black/80 backdrop-blur-lg rounded-2xl p-8 border border-pink-500/50 shadow-2xl shadow-pink-500/20"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 0 30px rgba(236, 72, 153, 0.4)"
            }}
          >
            <h2 className="text-2xl font-bold text-pink-400 mb-4 font-mono flex items-center gap-2">
              CONNECTIONS
            </h2>
            {data.email && (
              <p className="text-pink-100 mb-4 font-mono flex items-center gap-2">
                <Mail size={18} />
                {data.email}
              </p>
            )}
            {data.socialLinks && (
              <div className="flex gap-4">
                {data.socialLinks.map((social, i) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={i}
                      href={social.url}
                      className="bg-cyan-500/20 hover:bg-cyan-500/40 p-3 rounded transition-all border border-cyan-500/30"
                      whileHover={{ 
                        scale: 1.15,
                        boxShadow: "0 0 20px rgba(6, 182, 212, 0.6)"
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="text-cyan-400" size={20} />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {data.links && data.links.length > 0 && (
          <motion.div 
            className="grid md:grid-cols-2 gap-6 mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            {data.links.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                className="group bg-black/80 backdrop-blur-lg rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-400/70 transition-all shadow-lg hover:shadow-cyan-500/30 font-mono"
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  boxShadow: "0 0 25px rgba(6, 182, 212, 0.5)"
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
              >
                <h3 className="font-bold text-cyan-400 text-lg mb-2 group-hover:text-cyan-300 transition-colors">
                  {link.title}
                </h3>
                {link.description && (
                  <p className="text-cyan-200/70 text-sm">{link.description}</p>
                )}
                <ExternalLink className="text-cyan-500 group-hover:text-cyan-400 transition-colors mt-2" size={16} />
              </motion.a>
            ))}
          </motion.div>
        )}

        {data.cta && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
          >
            <motion.button
              className="bg-gradient-to-r from-cyan-500 to-pink-500 text-white px-12 py-4 rounded font-bold text-xl shadow-2xl shadow-cyan-500/50 font-mono border-2 border-cyan-400/50"
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 40px rgba(6, 182, 212, 0.8)",
                borderColor: "rgba(6, 182, 212, 1)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {data.cta}
            </motion.button>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        @keyframes grid-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
};

// Premium template mapping
export const premiumTemplates = {
  cosmicFlow: CosmicFlowTheme,
  glassMorphism: GlassMorphismTheme,
  neonCity: NeonCityTheme,
};

// Premium features indicator
export const PremiumBadge = () => (
  <motion.div 
    className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full"
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <Sparkles size={12} />
    PRO
  </motion.div>
);
