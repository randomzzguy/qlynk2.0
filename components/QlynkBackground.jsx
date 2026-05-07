"use client";

import { useEffect, useRef } from "react";

export default function QlynkBackground() {
  const particleFieldRef = useRef(null);
  const neuralNetworkRef = useRef(null);
  const particleIntervalRef = useRef(null);

  useEffect(() => {
    const particleField = particleFieldRef.current;
    const network = neuralNetworkRef.current;
    if (!particleField || !network) return;

    const lines = [];
    for (let i = 0; i < 10; i++) {
      const line = document.createElement("div");
      line.className = "qlynk-neural-line";
      line.style.top = Math.random() * 100 + "%";
      line.style.left = Math.random() * 100 + "%";
      line.style.width = Math.random() * 200 + 50 + "px";
      line.style.transform = `rotate(${Math.random() * 360}deg)`;
      line.style.animationDelay = Math.random() * 3 + "s";
      network.appendChild(line);
      lines.push(line);
    }

    particleIntervalRef.current = setInterval(() => {
      const p = document.createElement("div");
      p.className = "qlynk-particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = Math.random() * 5 + 3 + "s";
      p.style.animationDelay = Math.random() * 2 + "s";
      particleField.appendChild(p);
      setTimeout(() => { p.remove(); }, 8000);
    }, 200);

    return () => {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
      }
      lines.forEach((l) => l.remove());
      if (particleField) particleField.innerHTML = "";
    };
  }, []);

  return (
    <div className="qlynk-bg-container">
      <div className="qlynk-holographic-overlay" />
      <div className="qlynk-particle-field" ref={particleFieldRef} />
      <div className="qlynk-neural-network" ref={neuralNetworkRef} />
    </div>
  );
}
