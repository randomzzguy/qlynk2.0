'use client';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

class ParticleSystem {
  constructor(canvas, mockup) {
    this.particles = [];
    this.ambientParticles = [];
    this.canvas = canvas;
    this.mockup = mockup;
    this.animationId = null;
    this.phase = 'gathering';
    this.phaseTimer = 0;
    this.currentTheme = 0;
    this.themes = [
      { name: 'Business Theme', colors: { header: '#2c3e50', nav: '#3498db', hero: '#e74c3c', section: '#95a5a6', footer: '#34495e' }, pattern: 'corporate', particleCount: { header: 24, nav: 32, hero: 40, section: 18, footer: 14 } },
      { name: 'Creative Theme', colors: { header: '#9b59b6', nav: '#e67e22', hero: '#f39c12', section: '#1abc9c', footer: '#e91e63' }, pattern: 'artistic', particleCount: { header: 28, nav: 36, hero: 48, section: 24, footer: 18 } },
      { name: 'Tech Theme', colors: { header: '#0f4c75', nav: '#00d2ff', hero: '#3742fa', section: '#2ed573', footer: '#1e3799' }, pattern: 'digital', particleCount: { header: 26, nav: 34, hero: 44, section: 22, footer: 16 } },
      { name: 'Nature Theme', colors: { header: '#27ae60', nav: '#2ecc71', hero: '#f39c12', section: '#16a085', footer: '#229954' }, pattern: 'organic', particleCount: { header: 30, nav: 38, hero: 52, section: 26, footer: 20 } },
      { name: 'Minimal Theme', colors: { header: '#2c2c2c', nav: '#4a4a4a', hero: '#666666', section: '#888888', footer: '#333333' }, pattern: 'minimal', particleCount: { header: 20, nav: 26, hero: 36, section: 16, footer: 12 } }
    ];
    this.mockupElements = [
      { selector: '.mockup-header', type: 'header' },
      { selector: '.mockup-nav', type: 'nav' },
      { selector: '.mockup-hero', type: 'hero' },
      { selector: '.mockup-section', type: 'section' },
      { selector: '.mockup-footer', type: 'footer' }
    ];
    this.createAmbientParticles();
    this.startAnimation();
  }

  createAmbientParticles() {
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'ambient-particle';
      p.style.left = Math.random() * this.canvas.clientWidth + 'px';
      p.style.top = Math.random() * this.canvas.clientHeight + 'px';
      this.canvas.appendChild(p);
      this.ambientParticles.push(p);
      this.animateAmbientParticle(p);
    }
  }

  animateAmbientParticle(p) {
    const duration = 9000 + Math.random() * 6000;
    const startX = parseFloat(p.style.left);
    const startY = parseFloat(p.style.top);
    const endX = Math.random() * this.canvas.clientWidth;
    const endY = Math.random() * this.canvas.clientHeight;
    let startTime = null;
    const animate = (t) => {
      if (!startTime) startTime = t;
      const prog = Math.min((t - startTime) / duration, 1);
      const ease = -(Math.cos(Math.PI * prog) - 1) / 2;
      const cx = startX + (endX - startX) * ease;
      const cy = startY + (endY - startY) * ease;
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.opacity = 0.3 + Math.sin(t * 0.003) * 0.2;
      if (prog < 1) requestAnimationFrame(animate); else this.animateAmbientParticle(p);
    };
    requestAnimationFrame(animate);
  }

  createParticle(target, type) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const theme = this.themes[this.currentTheme];
    const color = theme.colors[type];
    particle.style.background = `radial-gradient(circle, ${color} 0%, ${color}aa 100%)`;
    particle.style.boxShadow = `0 0 4px ${color}40, 0 0 8px ${color}20`;
    const size = 5 + Math.floor(Math.random() * 5);
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.opacity = '0';
    particle.style.filter = 'saturate(0.2) brightness(0.85)';
    particle.dataset.color = color;
    let startX, startY;
    const side = Math.floor(Math.random() * 4);
    const rectCanvas = this.canvas.getBoundingClientRect();
    if (side === 0) { startX = Math.random() * rectCanvas.width; startY = 1; }
    else if (side === 1) { startX = rectCanvas.width - 1; startY = Math.random() * rectCanvas.height; }
    else if (side === 2) { startX = Math.random() * rectCanvas.width; startY = rectCanvas.height - 1; }
    else { startX = 1; startY = Math.random() * rectCanvas.height; }
    particle.style.left = startX + 'px';
    particle.style.top = startY + 'px';
    const rect = target.getBoundingClientRect();
    const targetX = (rect.left - rectCanvas.left) + Math.random() * rect.width;
    const targetY = (rect.top - rectCanvas.top) + Math.random() * rect.height;
    particle.targetX = targetX;
    particle.targetY = targetY;
    particle.startX = startX;
    particle.startY = startY;
    particle.progress = 0;
    particle.speed = 0.03 + Math.random() * 0.02;
    particle.delay = Math.random() * 500;
    this.canvas.appendChild(particle);
    return particle;
  }

  updateParticles() {
    const now = Date.now();
    this.particles.forEach((p) => {
      const start = p.startTime + p.delay;
      if (now < start) return;
      if (this.phase === 'gathering') {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 1;
        const ease = p.progress < 0.5 ? 4 * p.progress * p.progress * p.progress : 1 - Math.pow(-2 * p.progress + 2, 3) / 2;
        const cx = p.startX + (p.targetX - p.startX) * ease;
        const cy = p.startY + (p.targetY - p.startY) * ease;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.opacity = Math.min(1, ease);
        const col = p.dataset.color;
        const glow1 = (12 + 18 * ease).toFixed(1);
        const glow2 = (18 + 26 * ease).toFixed(1);
        p.style.boxShadow = `0 0 ${glow1}px ${col}80, 0 0 ${glow2}px ${col}60`;
        p.style.filter = `saturate(${(0.3 + ease).toFixed(2)}) brightness(${(0.85 + ease * 0.15).toFixed(2)})`;
      } else if (this.phase === 'dissolving') {
        p.progress += p.speed * 2;
        if (p.progress > 1) p.progress = 1;
        const ease = p.progress * p.progress * p.progress;
    const centerX = this.canvas.clientWidth / 2;
    const centerY = this.canvas.clientHeight / 2;
    const angle = Math.atan2(p.targetY - centerY, p.targetX - centerX);
    const dist = 520 * ease;
    const cx = p.targetX + Math.cos(angle) * dist;
    const cy = p.targetY + Math.sin(angle) * dist;
    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    p.style.opacity = Math.max(0, (1 - ease) * 0.95);
    p.style.filter = `saturate(${(1 - ease * 0.8).toFixed(2)}) brightness(${(1 - ease * 0.2).toFixed(2)})`;
  }
    });
  }

  startCycle() {
    this.particles.forEach((p) => p.parentNode && p.parentNode.removeChild(p));
    this.particles = [];
    const theme = this.themes[this.currentTheme];
    const startTime = Date.now();
    this.updateMockupColors(theme);
    this.mockupElements.forEach((el) => {
      const targets = this.mockup.querySelectorAll(el.selector);
      const count = theme.particleCount[el.type];
      targets.forEach((target) => {
        for (let i = 0; i < count; i++) {
          const p = this.createParticle(target, el.type);
          p.startTime = startTime + i * 5;
          this.particles.push(p);
        }
      });
    });
    this.phase = 'gathering';
    this.phaseTimer = 0;
    this.mockup.style.opacity = '0';
    this.mockup.style.transform = 'translate(-50%, -50%) scale(0.9)';
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
    sections.forEach((s) => (s.style.background = `linear-gradient(135deg, ${theme.colors.section} 0%, ${theme.colors.section}dd 100%)`));
  }

  animate() {
    this.phaseTimer += 16;
    if (this.phase === 'gathering') {
      this.updateParticles();
      const allReached = this.particles.every((p) => p.progress >= 1);
      if (allReached || this.phaseTimer > 2600) {
        this.phase = 'forming';
        this.phaseTimer = 0;
        this.mockup.style.transition = 'all 0.6s ease';
        this.mockup.style.opacity = '1';
        this.mockup.style.transform = 'translate(-50%, -50%) scale(1)';
        this.mockup.style.zIndex = '740';
        this.particles.forEach((p) => { p.style.zIndex = '700'; });
      }
    } else if (this.phase === 'forming') {
      if (this.phaseTimer > 1800) {
        this.phase = 'dissolving';
        this.phaseTimer = 0;
        this.mockup.style.transition = 'all 0.5s ease-in';
        this.mockup.style.opacity = '0';
        this.mockup.style.transform = 'translate(-50%, -50%) scale(1.05)';
        this.particles.forEach((p) => { p.style.zIndex = '710'; });
        this.particles.forEach((p) => {
          p.progress = 0;
          p.startTime = Date.now();
        });
      }
    } else if (this.phase === 'dissolving') {
      this.updateParticles();
      if (this.phaseTimer > 1600) {
        this.currentTheme = (this.currentTheme + 1) % this.themes.length;
        setTimeout(() => this.startCycle(), 200);
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
    [...this.particles, ...this.ambientParticles].forEach((p) => p.parentNode && p.parentNode.removeChild(p));
  }
}

export default function HtmlAnimation() {
  const particleCanvasRef = useRef(null);
  const websiteMockupRef = useRef(null);

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    const mockup = websiteMockupRef.current;
    if (!canvas || !mockup) return;

    const system = new ParticleSystem(canvas, mockup);
    return () => system.destroy();
  }, []);
  return (
    <div className="html-animation w-full relative z-[600]">
      <main className="magic-container">
        <div className="particle-canvas" ref={particleCanvasRef}></div>
        <div className="website-mockup" ref={websiteMockupRef}>
          <div className="mockup-browser">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot dot-red"></div>
                <div className="mockup-dot dot-yellow"></div>
                <div className="mockup-dot dot-green"></div>
              </div>
            </div>
            <div className="mockup-content">
              <div className="mockup-nav"></div>
              <div className="mockup-hero"></div>
              <div className="mockup-sections">
                <div className="mockup-section"></div>
                <div className="mockup-section"></div>
                <div className="mockup-section"></div>
              </div>
              <div className="mockup-footer"></div>
            </div>
          </div>
        </div>
        

        <div className="magic-wand-cursor">
          <Image src="/assets/icon.svg" alt="" width={36} height={36} className="wand-icon" />
        </div>
      </main>
    </div>
  );
}
