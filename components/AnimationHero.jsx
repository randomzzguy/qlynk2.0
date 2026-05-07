'use client';

import React, { useEffect, useRef } from 'react';

class ParticleSystem {
  constructor(canvas, mockup, themeIndicator, mockupUrl) {
    this.particles = [];
    this.ambientParticles = [];
    this.canvas = canvas;
    this.mockup = mockup;
    this.themeIndicator = themeIndicator;
    this.mockupUrl = mockupUrl;
    this.animationId = null;
    this.phase = 'gathering';
    this.phaseTimer = 0;
    this.currentTheme = 0;

    this.themes = [
      { name: 'Business Theme', url: 'business-pro.com', colors: { header: '#2c3e50', nav: '#3498db', hero: '#e74c3c', section: '#95a5a6', footer: '#34495e' }, pattern: 'corporate', particleCount: { header: 20, nav: 24, hero: 30, section: 12, footer: 8 } },
      { name: 'Creative Theme', url: 'creative-studio.com', colors: { header: '#9b59b6', nav: '#e67e22', hero: '#f39c12', section: '#1abc9c', footer: '#e91e63' }, pattern: 'artistic', particleCount: { header: 24, nav: 28, hero: 40, section: 14, footer: 10 } },
      { name: 'Tech Theme', url: 'tech-innovation.com', colors: { header: '#0f4c75', nav: '#00d2ff', hero: '#3742fa', section: '#2ed573', footer: '#1e3799' }, pattern: 'digital', particleCount: { header: 22, nav: 26, hero: 36, section: 13, footer: 9 } }
    ];

    this.mockupElements = [
      { selector: '.mockup-header', type: 'header', size: 'small' },
      { selector: '.mockup-nav', type: 'nav', size: 'medium' },
      { selector: '.mockup-hero', type: 'hero', size: 'large' },
      { selector: '.mockup-section', type: 'section', size: 'medium' },
      { selector: '.mockup-footer', type: 'footer', size: 'small' }
    ];

    this.createAmbientParticles();
    this.startAnimation();
  }

  createAmbientParticles() {
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'ambient-particle';
      p.style.left = Math.random() * window.innerWidth + 'px';
      p.style.top = Math.random() * window.innerHeight + 'px';
      p.style.pointerEvents = 'none';
      this.canvas.appendChild(p);
      this.ambientParticles.push(p);
      this.animateAmbientParticle(p);
    }
  }

  animateAmbientParticle(particle) {
    const duration = 15000 + Math.random() * 10000;
    const startX = parseFloat(particle.style.left);
    const startY = parseFloat(particle.style.top);
    const endX = Math.random() * window.innerWidth;
    const endY = Math.random() * window.innerHeight;
    let startTime = null;

    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = this.easeInOutSine(t);
      const x = startX + (endX - startX) * ease;
      const y = startY + (endY - startY) * ease;
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.opacity = 0.3 + Math.sin(elapsed * 0.003) * 0.2;
      if (t < 1) requestAnimationFrame(animate); else this.animateAmbientParticle(particle);
    };

    requestAnimationFrame(animate);
  }

  createParticle(targetElement, type) {
    const particle = document.createElement('div');
    particle.className = `particle ${type}`;
    const theme = this.themes[this.currentTheme];
    const color = theme.colors[type] || '#666';

    particle.style.pointerEvents = 'none';
    particle.style.background = `radial-gradient(circle, ${color} 0%, ${color}aa 100%)`;
    particle.style.boxShadow = `0 0 15px ${color}80, 0 0 25px ${color}60`;
    particle.style.borderRadius = '50%';
    particle.style.transform = 'translate(-50%,-50%)';

    // Pattern-based start (viewport-based)
    let startX, startY;
    const pattern = theme.pattern;
    const margin = 60;
    if (pattern === 'corporate') {
      const side = Math.floor(Math.random() * 4);
      switch(side) {
        case 0: startX = Math.random() * window.innerWidth; startY = -margin; break;
        case 1: startX = window.innerWidth + margin; startY = Math.random() * window.innerHeight; break;
        case 2: startX = Math.random() * window.innerWidth; startY = window.innerHeight + margin; break;
        default: startX = -margin; startY = Math.random() * window.innerHeight; break;
      }
    } else if (pattern === 'artistic') {
      const angle = Math.random() * Math.PI * 2;
      const radius = 800 + Math.random() * 200;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      startX = cx + Math.cos(angle) * radius;
      startY = cy + Math.sin(angle) * radius;
    } else if (pattern === 'digital') {
      const side = Math.floor(Math.random() * 4);
      if (side < 2) { startX = Math.random() * window.innerWidth; startY = side === 0 ? -margin : window.innerHeight + margin; }
      else { startX = side === 2 ? -margin : window.innerWidth + margin; startY = Math.random() * window.innerHeight; }
    } else {
      startX = Math.random() * (window.innerWidth + margin * 2) - margin;
      startY = -margin - Math.random() * 200;
    }

    particle.startX = startX;
    particle.startY = startY;
    particle.style.left = startX + 'px';
    particle.style.top = startY + 'px';

    // size by type
    const sizeMap = { header: 4, nav: 6, hero: 9, section: 6, footer: 4 };
    const sz = sizeMap[type] || 6;
    particle.style.width = sz + 'px';
    particle.style.height = sz + 'px';

    const rect = targetElement.getBoundingClientRect();
    particle.targetX = rect.left + Math.random() * rect.width;
    particle.targetY = rect.top + Math.random() * rect.height;
    particle.progress = 0;
    particle.speed = 0.02 + Math.random() * 0.02;
    particle.delay = 0;

    this.canvas.appendChild(particle);
    return particle;
  }

  updateParticles() {
    const now = Date.now();
    this.particles.forEach((p, idx) => {
      if (p.startTime && now < p.startTime + (p.delay || 0)) return;

      if (this.phase === 'gathering') {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 1;
        const ease = this.easeInOutCubic(p.progress);
        const x = p.startX + (p.targetX - p.startX) * ease;
        const y = p.startY + (p.targetY - p.startY) * ease;
        // subtle theme variations
        if (this.themes[this.currentTheme].pattern === 'artistic') {
          const spiral = (1 - ease) * 30;
          const ang = now * 0.002 + idx;
          p.style.left = x + Math.cos(ang) * spiral + 'px';
          p.style.top = y + Math.sin(ang) * spiral + 'px';
        } else {
          p.style.left = x + 'px';
          p.style.top = y + 'px';
        }
        p.style.opacity = Math.min(1, ease * 0.95);
      } else if (this.phase === 'dissolving') {
        p.progress += p.speed * 2.2;
        if (p.progress > 1) p.progress = 1;
        const ease = this.easeInCubic(p.progress);
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const angle = Math.atan2(p.targetY - cy, p.targetX - cx);
        const dist = 700 * ease;
        p.style.left = (p.targetX + Math.cos(angle) * dist) + 'px';
        p.style.top = (p.targetY + Math.sin(angle) * dist) + 'px';
        p.style.opacity = Math.max(0, 1 - ease);
      }
    });
  }

  startCycle() {
    this.particles.forEach(pt => pt.remove());
    this.particles = [];

    const theme = this.themes[this.currentTheme];
    this.themeIndicator.textContent = theme.name;
    this.mockupUrl.textContent = theme.url;
    this.updateMockupColors(theme);

    const startTime = Date.now();

    this.mockupElements.forEach((el, elementIndex) => {
      const targets = this.mockup.querySelectorAll(el.selector);
      const count = theme.particleCount[el.type] || 10;
      targets.forEach((t) => {
        for (let i = 0; i < count; i++) {
          const p = this.createParticle(t, el.type);
          p.startTime = startTime + (elementIndex * 100) + (i * 5);
          this.particles.push(p);
        }
      });
    });

    this.phase = 'gathering';
    this.phaseTimer = 0;
    if (this.mockup) {
      this.mockup.style.opacity = '0';
      this.mockup.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }
  }

  updateMockupColors(theme) {
    const header = this.mockup.querySelector('.mockup-header');
    const nav = this.mockup.querySelector('.mockup-nav');
    const hero = this.mockup.querySelector('.mockup-hero');
    const sections = this.mockup.querySelectorAll('.mockup-section');
    const footer = this.mockup.querySelector('.mockup-footer');
    if (header) header.style.background = `linear-gradient(135deg, ${theme.colors.header} 0%, ${theme.colors.header}dd 100%)`;
    if (nav) nav.style.background = `linear-gradient(135deg, ${theme.colors.nav} 0%, ${theme.colors.nav}dd 100%)`;
    if (hero) hero.style.background = `linear-gradient(135deg, ${theme.colors.hero} 0%, ${theme.colors.hero}dd 100%)`;
    if (footer) footer.style.background = `linear-gradient(135deg, ${theme.colors.footer} 0%, ${theme.colors.footer}dd 100%)`;
    sections.forEach(s => s.style.background = `linear-gradient(135deg, ${theme.colors.section} 0%, ${theme.colors.section}dd 100%)`);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeInCubic(t) {
    return t * t * t;
  }

  easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  animate() {
    this.phaseTimer += 16;
    if (this.phase === 'gathering') {
      this.updateParticles();
      const all = this.particles.every(p => p.progress >= 1);
      if (all || this.phaseTimer > 2200) {
        this.phase = 'forming';
        this.phaseTimer = 0;
        if (this.mockup) { this.mockup.style.transition = 'all 0.6s ease'; this.mockup.style.opacity = '1'; this.mockup.style.transform = 'translate(-50%, -50%) scale(1)'; }
      }
    } else if (this.phase === 'forming') {
      if (this.phaseTimer > 1400) {
        this.phase = 'dissolving';
        this.phaseTimer = 0;
        this.particles.forEach(p => { p.progress = 0; p.startTime = Date.now(); });
      }
    } else if (this.phase === 'dissolving') {
      this.updateParticles();
      if (this.phaseTimer > 1200) {
        this.currentTheme = (this.currentTheme + 1) % this.themes.length;
        setTimeout(() => this.startCycle(), 150);
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    this.startCycle();
    this.animate();
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    [...this.particles, ...this.ambientParticles].forEach(p => p.remove());
  }
}

export default function AnimationHero() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mockupRef = useRef(null);
  const themeIndicatorRef = useRef(null);
  const mockupUrlRef = useRef(null);
  const particleSystemRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const mockup = mockupRef.current;
    const themeIndicator = themeIndicatorRef.current;
    const mockupUrl = mockupUrlRef.current;
    if (!container || !canvas || !mockup || !themeIndicator || !mockupUrl) return;

    particleSystemRef.current = new ParticleSystem(canvas, mockup, themeIndicator, mockupUrl);

    return () => {
      if (particleSystemRef.current) particleSystemRef.current.destroy();
    };
  }, []);

  return (
    <div className="animation-hero-container mx-auto my-12" ref={containerRef}>
      <div className="particle-canvas" ref={canvasRef} />
      <div className="website-mockup" ref={mockupRef}>
        <div className="mockup-browser">
          <div className="mockup-header">
            <div className="mockup-dots">
              <div className="mockup-dot dot-red" />
              <div className="mockup-dot dot-yellow" />
              <div className="mockup-dot dot-green" />
            </div>
            <div className="mockup-url" ref={mockupUrlRef}>business-theme.com</div>
          </div>
          <div className="mockup-content">
            <div className="mockup-nav" />
            <div className="mockup-hero" />
            <div className="mockup-sections">
              <div className="mockup-section" />
              <div className="mockup-section" />
              <div className="mockup-section" />
            </div>
            <div className="mockup-footer" />
          </div>
        </div>
      </div>
      <div className="theme-indicator" ref={themeIndicatorRef}>Business Theme</div>
      <style jsx>{`
        .animation-hero-container { position: relative; width: 100%; max-width: 900px; height: 320px; }
        .particle-canvas { position: absolute; inset: 0; z-index: 40; pointer-events: none; }
        .website-mockup { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 420px; height: 280px; z-index: 20; border-radius: 16px; }
        .mockup-browser { width: 100%; height: 100%; background: rgba(255,255,255,0.95); border-radius: 16px; box-shadow: 0 30px 80px rgba(0,0,0,0.12); overflow: hidden; backdrop-filter: blur(6px); }
        .mockup-header { height: 44px; display:flex; align-items:center; padding:0 12px; gap:12px; border-bottom:1px solid rgba(0,0,0,0.06); }
        .mockup-dots { display:flex; gap:6px; }
        .mockup-dot { width:12px; height:12px; border-radius:50%; }
        .dot-red{background:linear-gradient(135deg,#ff6b6b,#ee5a52);} .dot-yellow{background:linear-gradient(135deg,#ffd93d,#ffcd02);} .dot-green{background:linear-gradient(135deg,#6bcf7f,#4dabf7);} 
        .mockup-url { margin-left:8px; background:rgba(255,255,255,0.85); padding:6px 12px; border-radius:18px; font-size:12px; color:#4b5563; border:1px solid rgba(0,0,0,0.06); }
        .mockup-content { padding:18px; height:calc(100% - 62px); display:flex; flex-direction:column; gap:12px; }
        .mockup-nav{height:36px;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);} .mockup-hero{height:84px;border-radius:10px;background:linear-gradient(135deg,#f093fb,#f5576c);} .mockup-section{flex:1;border-radius:8px;background:linear-gradient(135deg,#a8edea,#fed6e3);} .mockup-footer{height:30px;border-radius:6px;background:linear-gradient(135deg,#d299c2,#fef9d7);} 
        .ambient-particle{position:absolute;width:3px;height:3px;background:rgba(0,0,0,0.06);border-radius:50%;}
        .particle{position:absolute;border-radius:50%;width:6px;height:6px;pointer-events:none;transform:translate(-50%,-50%);box-shadow:0 0 10px rgba(0,0,0,0.12);}
        .particle.header{width:5px;height:5px;} .particle.nav{width:6px;height:6px;} .particle.hero{width:8px;height:8px;} .particle.section{width:6px;height:6px;} .particle.footer{width:5px;height:5px;}
        .theme-indicator{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:40;padding:8px 16px;border-radius:20px;background:rgba(0,0,0,0.45);color:#fff;font-weight:600;border:1px solid rgba(255,255,255,0.06);}
      `}</style>
    </div>
  );
}
