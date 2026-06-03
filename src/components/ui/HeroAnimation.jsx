"use client";

import { useEffect, useState, useCallback } from "react";

const PHASES = {
  BLANK: 0,
  WRITING: 1,
  SIGNING: 2,
  SHRINK: 3,
  FADING: 4,
};

const TIMINGS = {
  BLANK_TO_WRITING: 1000,
  WRITING_TO_SIGNING: 2200,
  SIGNING_TO_SHRINK: 2200,
  SHRINK_HOLD: 2400,
  FADE_DURATION: 800,
};

export function HeroAnimation() {
  const [phase, setPhase] = useState(PHASES.BLANK);
  const [cycle, setCycle] = useState(0);

  const runCycle = useCallback(() => {
    setPhase(PHASES.BLANK);

    const t1 = setTimeout(() => setPhase(PHASES.WRITING), TIMINGS.BLANK_TO_WRITING);
    const t2 = setTimeout(() => setPhase(PHASES.SIGNING), TIMINGS.BLANK_TO_WRITING + TIMINGS.WRITING_TO_SIGNING);
    const t3 = setTimeout(() => setPhase(PHASES.SHRINK), TIMINGS.BLANK_TO_WRITING + TIMINGS.WRITING_TO_SIGNING + TIMINGS.SIGNING_TO_SHRINK);
    const t4 = setTimeout(() => setPhase(PHASES.FADING), TIMINGS.BLANK_TO_WRITING + TIMINGS.WRITING_TO_SIGNING + TIMINGS.SIGNING_TO_SHRINK + TIMINGS.SHRINK_HOLD);
    const t5 = setTimeout(() => setCycle((c) => c + 1), TIMINGS.BLANK_TO_WRITING + TIMINGS.WRITING_TO_SIGNING + TIMINGS.SIGNING_TO_SHRINK + TIMINGS.SHRINK_HOLD + TIMINGS.FADE_DURATION);

    return [t1, t2, t3, t4, t5];
  }, []);

  useEffect(() => {
    const timers = runCycle();
    return () => timers.forEach(clearTimeout);
  }, [cycle, runCycle]);

  const isFading = phase === PHASES.FADING;

  return (
    <div className="hero-anim-wrapper">
      <div className={`hero-anim-container ${isFading ? "hero-fading" : ""}`}>
        <svg
          viewBox="0 0 400 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="hero-anim-svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hero-page-top, #ffffff)" />
              <stop offset="100%" stopColor="var(--hero-page-bottom, #f8f9fc)" />
            </linearGradient>
            <linearGradient id="stampGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--hero-stamp-start, #7c3aed)" />
              <stop offset="100%" stopColor="var(--hero-stamp-end, #6d28d9)" />
            </linearGradient>
            <linearGradient id="pdfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="shineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="pageClip">
              <rect x="114" y="28" width="164" height="212" rx="6" />
            </clipPath>
          </defs>

          {/* === DOCUMENT === */}
          <g className={`hero-document ${phase === PHASES.SIGNING ? "hero-signing-shake" : ""} ${phase >= PHASES.SHRINK ? "hero-shrinking" : ""}`}>
            <g className="hero-float-wrapper">
              {/* === PAGE === */}
              <g className={`hero-page ${phase >= PHASES.BLANK ? "hero-visible" : ""}`}>
                <rect x="118" y="32" width="164" height="212" rx="6" fill="var(--hero-shadow, rgba(0,0,0,0.08))" className="hero-page-shadow" />
                <rect x="114" y="28" width="164" height="212" rx="6" fill="url(#pageGrad)" stroke="var(--hero-page-stroke, #e2e8f0)" strokeWidth="1.5" />
                <g clipPath="url(#pageClip)">
                  <rect x="-100" y="28" width="80" height="300" fill="url(#shineGrad)" className="hero-page-shine" />
                </g>
                <path d="M248 28 L278 58 L248 58 Z" fill="var(--hero-fold, #e8ecf3)" stroke="var(--hero-page-stroke, #e2e8f0)" strokeWidth="1" />
                <rect x="136" y="50" width="80" height="6" rx="3" fill="var(--hero-title-line, #c7d2e0)" opacity="0.7" />
              </g>

              {/* === WRITING LINES === */}
              <g className={`hero-lines ${phase >= PHASES.WRITING ? "hero-visible" : ""}`}>
                <line x1="136" y1="74" x2="256" y2="74" className="hero-line hero-line-1" />
                <line x1="136" y1="86" x2="241" y2="86" className="hero-line hero-line-2" />
                <line x1="136" y1="98" x2="251" y2="98" className="hero-line hero-line-3" />
                <line x1="136" y1="110" x2="226" y2="110" className="hero-line hero-line-4" />
                <line x1="136" y1="126" x2="256" y2="126" className="hero-line hero-line-5" />
                <line x1="136" y1="138" x2="236" y2="138" className="hero-line hero-line-6" />
                <line x1="136" y1="150" x2="246" y2="150" className="hero-line hero-line-7" />
                <line x1="136" y1="166" x2="231" y2="166" className="hero-line hero-line-8" />
                <line x1="136" y1="178" x2="251" y2="178" className="hero-line hero-line-9" />
              </g>

              {/* === SIGNATURE / STAMP === */}
              <g className={`hero-stamp ${phase >= PHASES.SIGNING ? "hero-visible" : ""}`}>
                <g className="hero-stamp-seal">
                  <circle cx="236" cy="210" r="22" fill="url(#stampGrad)" opacity="0.15" className="hero-stamp-bg" />
                  <circle cx="236" cy="210" r="22" fill="none" stroke="url(#stampGrad)" strokeWidth="2" className="hero-stamp-ring" />
                  <path d="M225 210 L233 218 L248 203" stroke="var(--hero-check, #7c3aed)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="hero-stamp-check" />
                </g>
                <circle cx="236" cy="210" r="22" fill="none" stroke="url(#stampGrad)" strokeWidth="3" className="hero-stamp-ripple" />
                <path d="M145 215 C150 205, 158 220, 165 210 C172 200, 178 218, 185 208 C190 200, 195 215, 200 210" stroke="var(--hero-sig, #4338ca)" strokeWidth="1.8" strokeLinecap="round" fill="none" className="hero-sig-path" />
              </g>
            </g>
          </g>

          {/* === PDF FILE ICON === */}
          <g className={`hero-pdf ${phase >= PHASES.SHRINK ? "hero-visible" : ""}`}>
            {/* File body */}
            <rect x="168" y="108" width="64" height="84" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" className="hero-pdf-body" />
            {/* Corner fold */}
            <path d="M212 108 L232 128 L212 128 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" className="hero-pdf-fold" />
            {/* Red PDF badge */}
            <rect x="176" y="152" width="48" height="22" rx="4" fill="url(#pdfGrad)" className="hero-pdf-badge" />
            {/* PDF text */}
            <text x="200" y="168" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif" className="hero-pdf-text">PDF</text>
            {/* Mini lines on file */}
            <line x1="178" y1="121.5" x2="206" y2="121.5" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" className="hero-pdf-line hero-pdf-line-1" />
            <line x1="178" y1="129.5" x2="200" y2="129.5" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" className="hero-pdf-line hero-pdf-line-2" />
            <line x1="178" y1="137.5" x2="208" y2="137.5" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" className="hero-pdf-line hero-pdf-line-3" />
            {/* Checkmark badge on corner */}
            <circle cx="228" cy="112" r="10" fill="#22c55e" className="hero-pdf-check-bg" />
            <path d="M223 112 L226.5 115.5 L233 109" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hero-pdf-check" />
          </g>
        </svg>
      </div>

      <style jsx>{`
        .hero-anim-wrapper {
          position: relative;
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          /* Define physics-based spring easing as custom property */
          --spring-easing: linear(0, 0.016 0.5%, 0.06 1%, 0.226 2%, 1.116 5.4%, 1.375 6.6%, 1.527 7.7%, 1.565 8.2%, 1.585 8.8%, 1.581 9.3%, 1.559 9.8%, 1.458 10.9%, 0.937 14.3%, 0.784 15.5%, 0.693 16.6%, 0.67 17.1%, 0.657 17.7%, 0.671 18.7%, 0.729 19.8%, 1.042 23.3%, 1.13 24.5%, 1.182 25.6%, 1.201 26.7%, 1.192 27.7%, 1.156 28.8%, 0.977 32.2%, 0.925 33.4%, 0.894 34.5%, 0.882 35.6%, 0.887 36.6%, 0.907 37.7%, 1.045 42.4%, 1.069 44.5%, 1.059 46.3%, 0.979 50.9%, 0.96 53.4%, 0.966 55.3%, 1.013 59.9%, 1.024 62.3%, 0.986 71.2%, 1.008 79.9%, 0.995 88.9%, 1);
        }

        .hero-anim-container {
          position: relative;
          padding: 1rem;
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .hero-anim-container.hero-fading {
          opacity: 0;
          transform: scale(0.96) translateY(5px);
        }

        .hero-anim-svg {
          width: 100%;
          height: auto;
        }

        /* ── Idle float wrapper ── */
        .hero-float-wrapper {
          transform-origin: 196px 134px;
          animation: floatIdle 6s ease-in-out infinite;
        }

        @keyframes floatIdle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(0.6deg);
          }
        }

        /* ── Page entrance & shadow ── */
        .hero-page {
          opacity: 0;
          transform: translateY(35px) rotate(-3deg) scale(0.92);
          transform-origin: 196px 134px;
          transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease;
          transition-timing-function: var(--spring-easing), ease;
        }
        .hero-page.hero-visible {
          opacity: 1;
          transform: translateY(0) rotate(0deg) scale(1);
        }

        .hero-page-shadow {
          transition: all 0.6s ease;
          transform-origin: 196px 134px;
        }
        .hero-page.hero-visible .hero-page-shadow {
          animation: heroShadowPulse 3.5s ease-in-out infinite;
        }

        @keyframes heroShadowPulse {
          0%, 100% { opacity: 0.08; transform: translate(4px, 4px) scale(1); }
          50% { opacity: 0.13; transform: translate(6px, 7px) scale(0.99); }
        }

        /* ── Diagonal Page Shine ── */
        .hero-page-shine {
          opacity: 0;
        }
        .hero-page.hero-visible .hero-page-shine {
          animation: shineSweep 1.8s ease-in-out 0.6s forwards;
        }

        @keyframes shineSweep {
          0% {
            transform: translate(-180px, -80px) rotate(22deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(280px, 80px) rotate(22deg);
            opacity: 0;
          }
        }

        /* ── Ink writing lines ── */
        .hero-lines { opacity: 0; }
        .hero-lines.hero-visible { opacity: 1; }

        .hero-line {
          stroke: var(--hero-text-line, #c7d2e0);
          stroke-width: 4;
          stroke-linecap: round;
          opacity: 0;
        }

        .hero-line-1 { stroke-dasharray: 120; stroke-dashoffset: 120; }
        .hero-line-2 { stroke-dasharray: 105; stroke-dashoffset: 105; }
        .hero-line-3 { stroke-dasharray: 115; stroke-dashoffset: 115; }
        .hero-line-4 { stroke-dasharray: 90; stroke-dashoffset: 90; }
        .hero-line-5 { stroke-dasharray: 120; stroke-dashoffset: 120; }
        .hero-line-6 { stroke-dasharray: 100; stroke-dashoffset: 100; }
        .hero-line-7 { stroke-dasharray: 110; stroke-dashoffset: 110; }
        .hero-line-8 { stroke-dasharray: 95; stroke-dashoffset: 95; }
        .hero-line-9 { stroke-dasharray: 115; stroke-dashoffset: 115; }

        .hero-lines.hero-visible .hero-line {
          opacity: 0.65;
          animation: drawInkLine 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .hero-lines.hero-visible .hero-line-1 { animation-delay: 0.0s; }
        .hero-lines.hero-visible .hero-line-2 { animation-delay: 0.12s; }
        .hero-lines.hero-visible .hero-line-3 { animation-delay: 0.24s; }
        .hero-lines.hero-visible .hero-line-4 { animation-delay: 0.36s; }
        .hero-lines.hero-visible .hero-line-5 { animation-delay: 0.52s; }
        .hero-lines.hero-visible .hero-line-6 { animation-delay: 0.64s; }
        .hero-lines.hero-visible .hero-line-7 { animation-delay: 0.76s; }
        .hero-lines.hero-visible .hero-line-8 { animation-delay: 0.92s; }
        .hero-lines.hero-visible .hero-line-9 { animation-delay: 1.04s; }

        @keyframes drawInkLine {
          to { stroke-dashoffset: 0; }
        }

        /* ── Signature & Stamp slam ── */
        .hero-stamp { opacity: 0; }
        .hero-stamp.hero-visible { opacity: 1; }

        /* Smooth drawing signature */
        .hero-sig-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }
        .hero-stamp.hero-visible .hero-sig-path {
          animation: drawSignature 1.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes drawSignature {
          to { stroke-dashoffset: 0; }
        }

        /* Squash and stretch stamp slam */
        .hero-stamp-seal {
          transform-origin: 236px 210px;
          opacity: 0;
        }
        .hero-stamp.hero-visible .hero-stamp-seal {
          animation: stampSlam 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2) 0.9s forwards;
        }

        @keyframes stampSlam {
          0% {
            opacity: 0;
            transform: scale(3.5) rotate(25deg);
            filter: blur(4px);
          }
          60% {
            opacity: 1;
            transform: scale(0.85, 0.7) rotate(-5deg); /* Squash */
            filter: blur(0);
          }
          80% {
            transform: scale(1.1, 1.15) rotate(2deg); /* Stretch */
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg); /* Settle */
          }
        }

        /* Draw checkmark on stamp imprint */
        .hero-stamp-check {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
        }
        .hero-stamp.hero-visible .hero-stamp-check {
          animation: drawCheck 0.4s ease 1.2s forwards;
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        /* Stamp Impact Ripple Wave */
        .hero-stamp-ripple {
          transform-origin: 236px 210px;
          opacity: 0;
        }
        .hero-stamp.hero-visible .hero-stamp-ripple {
          animation: stampRipple 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards;
        }
        @keyframes stampRipple {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
            stroke-width: 4;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
            stroke-width: 0.5;
          }
        }

        /* Document Impact Shake */
        .hero-signing-shake {
          animation: docImpactShake 0.45s ease 1.25s;
        }
        @keyframes docImpactShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-3px, 2px) rotate(-0.5deg); }
          30% { transform: translate(3px, -2px) rotate(0.8deg); }
          45% { transform: translate(-2px, 1px) rotate(-0.3deg); }
          60% { transform: translate(1px, 2px) rotate(0.2deg); }
          75% { transform: translate(-1px, -1px) rotate(-0.1deg); }
        }

        /* ── Document shrink/morph pop ── */
        .hero-document {
          transform-origin: 196px 134px;
        }

        .hero-document.hero-shrinking {
          animation: heroDocShrink 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes heroDocShrink {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.25);
            opacity: 0;
          }
        }

        /* ── PDF file icon pop entrance ── */
        .hero-pdf {
          transform-origin: 200px 150px;
          opacity: 0;
        }

        .hero-pdf.hero-visible {
          animation: heroPdfPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards;
          animation-timing-function: var(--spring-easing);
        }

        @keyframes heroPdfPop {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* PDF Checkmark corner badge */
        .hero-pdf-check-bg {
          transform-origin: 228px 112px;
          opacity: 0;
        }
        .hero-pdf.hero-visible .hero-pdf-check-bg {
          animation: popSpring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards;
        }

        .hero-pdf-check {
          opacity: 0;
        }
        .hero-pdf.hero-visible .hero-pdf-check {
          animation: fadeInCheck 0.3s ease 1.1s forwards;
        }

        @keyframes popSpring {
          0% { opacity: 0; transform: scale(0); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeInCheck {
          0% { opacity: 0; transform: translate(-2px, -2px); }
          100% { opacity: 1; transform: translate(0, 0); }
        }

        /* PDF Red Stamp Badge */
        .hero-pdf-badge {
          transform-origin: 200px 163px;
          opacity: 0;
        }
        .hero-pdf.hero-visible .hero-pdf-badge {
          animation: popSpring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
        }

        .hero-pdf-text {
          opacity: 0;
          transform-origin: 200px 163px;
        }
        .hero-pdf.hero-visible .hero-pdf-text {
          animation: popSpring 0.5s ease 0.7s forwards;
        }

        /* PDF Mini lines */
        .hero-pdf-line {
          opacity: 0;
        }
        .hero-pdf.hero-visible .hero-pdf-line {
          opacity: 0.65;
          animation: drawInkLine 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        
        .hero-pdf-line-1 { stroke-dasharray: 28; stroke-dashoffset: 28; }
        .hero-pdf-line-2 { stroke-dasharray: 22; stroke-dashoffset: 22; }
        .hero-pdf-line-3 { stroke-dasharray: 30; stroke-dashoffset: 30; }

        .hero-pdf.hero-visible .hero-pdf-line-1 { animation-delay: 0.4s; }
        .hero-pdf.hero-visible .hero-pdf-line-2 { animation-delay: 0.5s; }
        .hero-pdf.hero-visible .hero-pdf-line-3 { animation-delay: 0.6s; }

        /* ── Accessibility / Prefers Reduced Motion ── */
        @media (prefers-reduced-motion: reduce) {
          .hero-float-wrapper {
            animation: none !important;
          }
          .hero-page,
          .hero-line,
          .hero-stamp-seal,
          .hero-stamp-check,
          .hero-stamp-ripple,
          .hero-sig-path,
          .hero-pdf,
          .hero-pdf-check-bg,
          .hero-pdf-check,
          .hero-pdf-badge,
          .hero-pdf-text,
          .hero-pdf-line {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
          }
          .hero-page-shine {
            display: none !important;
          }
          .hero-document.hero-shrinking {
            display: none !important;
          }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hero-anim-wrapper {
            max-width: 320px;
          }
        }
      `}</style>
    </div>
  );
}
