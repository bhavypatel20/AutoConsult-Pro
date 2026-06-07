"use client";

import { useEffect, useState } from "react";
import { Gauge, CheckCircle, ShieldAlert, Cpu } from "lucide-react";

interface AutoLoaderProps {
  fullscreen?: boolean;
  message?: string;
  size?: number;
}

export default function AutoLoader({ fullscreen = false, message, size = 180 }: AutoLoaderProps) {
  const [rpm, setRpm] = useState(800);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loaderPhrases = [
    "Igniting spark plugs...",
    "Warming up dealership engine...",
    "Connecting inventory fuel injectors...",
    "Revving up RPM...",
    "Syncing dashboard layout...",
    "Polishing chassis databases...",
    "Optimizing transmission speed...",
  ];

  // Sync RPM state with the SVG animation cycle (3s cycle)
  useEffect(() => {
    let start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) % 3000;
      let currentRpm = 800;

      if (elapsed < 1200) {
        // 0% to 40% (revving up)
        const p = elapsed / 1200;
        currentRpm = Math.floor(800 + p * 5200); // 800 -> 6000
      } else if (elapsed < 1500) {
        // 40% to 50% (gear shift / drop)
        const p = (elapsed - 1200) / 300;
        currentRpm = Math.floor(6000 - p * 800); // 6000 -> 5200
      } else if (elapsed < 2400) {
        // 50% to 80% (redlining)
        const p = (elapsed - 1500) / 900;
        currentRpm = Math.floor(5200 + p * 3000); // 5200 -> 8200
      } else {
        // 80% to 100% (dropping down)
        const p = (elapsed - 2400) / 600;
        currentRpm = Math.floor(8200 - p * 7400); // 8200 -> 800
      }

      // Add realism jitter
      const jitter = Math.floor((Math.random() - 0.5) * 120);
      setRpm(Math.max(800, Math.min(8300, currentRpm + jitter)));
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Cycle phrases
  useEffect(() => {
    const textTimer = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loaderPhrases.length);
    }, 2200);
    return () => clearInterval(textTimer);
  }, [loaderPhrases.length]);

  const displayedMessage = message || loaderPhrases[loadingTextIndex];

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        textAlign: "center",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rev-needle {
          0% { transform: rotate(-120deg); }
          35% { transform: rotate(40deg); }
          45% { transform: rotate(15deg); }
          75% { transform: rotate(120deg); }
          80% { transform: rotate(115deg); }
          100% { transform: rotate(-120deg); }
        }
        @-webkit-keyframes rev-needle {
          0% { -webkit-transform: rotate(-120deg); }
          35% { -webkit-transform: rotate(40deg); }
          45% { -webkit-transform: rotate(15deg); }
          75% { -webkit-transform: rotate(120deg); }
          80% { -webkit-transform: rotate(115deg); }
          100% { -webkit-transform: rotate(-120deg); }
        }
        @keyframes draw-gauge {
          0% { stroke-dashoffset: 353; }
          35% { stroke-dashoffset: 120; }
          45% { stroke-dashoffset: 155; }
          75% { stroke-dashoffset: 0; }
          80% { stroke-dashoffset: 5; }
          100% { stroke-dashoffset: 353; }
        }
        @-webkit-keyframes draw-gauge {
          0% { stroke-dashoffset: 353; }
          35% { stroke-dashoffset: 120; }
          45% { stroke-dashoffset: 155; }
          75% { stroke-dashoffset: 0; }
          80% { stroke-dashoffset: 5; }
          100% { stroke-dashoffset: 353; }
        }
        @keyframes pulse-custom {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @-webkit-keyframes pulse-custom {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-pulse-custom {
          animation: pulse-custom 1s infinite alternate;
          -webkit-animation: pulse-custom 1s infinite alternate;
        }
      `}} />
      {/* Premium SVG Speedometer Loader */}
      <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Cyan to Emerald Premium Gradient */}
            <linearGradient id="gauge-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#ef4444" /> {/* Redline zone */}
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Speedometer Tick Ring Background */}
          <path
            d="M 40 160 A 75 75 0 1 1 160 160"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Glowing Speedometer Ring (Animated) */}
          <path
            d="M 40 160 A 75 75 0 1 1 160 160"
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="353"
            strokeDashoffset="353"
            style={{
              animation: "draw-gauge 3s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />

          {/* Dynamic Tick Marks */}
          <circle
            cx="100"
            cy="100"
            r="62"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="2"
            strokeDasharray="2, 6"
          />

          {/* Speedometer Dial Indicators */}
          <text x="35" y="172" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-outfit)">0</text>
          <text x="32" y="100" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-outfit)">3k</text>
          <text x="100" y="44" fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontFamily="var(--font-outfit)">5k</text>
          <text x="168" y="100" fill="rgba(239, 68, 68, 0.6)" fontSize="9" textAnchor="end" fontFamily="var(--font-outfit)">7k</text>
          <text x="165" y="172" fill="rgba(239, 68, 68, 0.9)" fontSize="9" textAnchor="end" fontFamily="var(--font-outfit)">9k</text>

          {/* Animated Speedometer Needle */}
          <g
            style={{
              transformOrigin: "100px 100px",
              animation: "rev-needle 3s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          >
            {/* Glow needle */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="32"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#neon-glow)"
            />
            {/* Solid accent needle */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Center Cap Hub */}
            <circle cx="100" cy="100" r="12" fill="#09090b" stroke="#06b6d4" strokeWidth="3.5" />
            <circle cx="100" cy="100" r="5" fill="#10b981" />
          </g>
        </svg>

        {/* Digital Dashboard HUD details inside the loader center */}
        <div
          style={{
            position: "absolute",
            top: "58%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "80px",
          }}
        >
          <span
            style={{
              fontSize: `${size * 0.08}px`,
              fontWeight: "bold",
              fontFamily: "monospace",
              color: rpm > 7000 ? "#ef4444" : "var(--text-main)",
              textShadow: rpm > 7000 ? "0 0 10px rgba(239,68,68,0.5)" : "0 0 10px rgba(6,182,212,0.3)",
              transition: "color 0.1s ease",
            }}
          >
            {rpm.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: `${size * 0.045}px`,
              color: rpm > 7000 ? "#ef4444" : "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: "2px",
            }}
          >
            {rpm > 7000 ? "Redline" : "RPM"}
          </span>
        </div>

        {/* Little Dashboard Warning Lights (pulsing) */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          opacity: 0.85
        }}>
          <Cpu size={12} className="animate-pulse-custom" style={{ color: "#f59e0b" }} />
          <Gauge size={12} className="animate-pulse-custom" style={{ color: "#10b981" }} />
        </div>
      </div>

      {/* Glassmorphic message container */}
      <div 
        className="glass-card" 
        style={{ 
          padding: "12px 24px", 
          borderRadius: "12px", 
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--border-light)",
          boxShadow: "none"
        }}
      >
        <span 
          style={{ 
            fontSize: "0.95rem", 
            fontWeight: 500, 
            color: "var(--primary)",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.5px"
          }}
        >
          {displayedMessage}
        </span>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(9, 9, 11, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
