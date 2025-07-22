import React, { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

interface AnimatedBannerProps {
  fadeOut?: boolean; // If true, banner fades out after animation
  onAnimationEnd?: () => void;
}

const ANIMATION_DURATION = 8000; // ms, total duration of all steps

// Custom hook to detect mobile
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

export const AnimatedBanner: React.FC<AnimatedBannerProps> = ({ fadeOut = false, onAnimationEnd }) => {
  const [step, setStep] = useState(0); // 0: nothing, 1: spiral, 2: text, 3: arrows, 4: done
  const [hide, setHide] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile(900);

  useEffect(() => {
    // Step-by-step animation
    timerRef.current = setTimeout(() => setStep(1), 100); // Spiral in
    const t1 = setTimeout(() => setStep(2), 900); // Text fade in
    const t2 = setTimeout(() => setStep(3), 1800); // Arrows slide in
    const t3 = setTimeout(() => setStep(4), ANIMATION_DURATION); // Animation done
    if (fadeOut) {
      const t4 = setTimeout(() => setHide(true), ANIMATION_DURATION + 800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [fadeOut]);

  useEffect(() => {
    if (step === 4 && onAnimationEnd) onAnimationEnd();
  }, [step, onAnimationEnd]);

  // Choose x coordinates based on device
  const faynoX = isMobile ? '20%' : 140;
  const syncX = isMobile ? '55%' : 570;

  return (
    <div
      className={[
        styles.bannerRoot,
        step >= 1 ? styles.spiralVisible : '',
        step >= 2 ? styles.textVisible : '',
        step >= 3 ? styles.arrowsVisible : '',
        step >= 4 ? styles.static : '',
        hide ? styles.fadeOut : '',
      ].join(' ')}
      aria-label="FaynoSync animated logo banner"
    >
      <svg
        viewBox="0 0 1050 340"
        className={styles.bannerSvg}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: '100%', height: 'auto', maxWidth: 1000 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Purple Up Arrow */}
        <g className={styles.arrowUp}>
          <path d="M60 320 C 180 80, 400 20, 650 140" stroke="url(#arrowUpGradient)" strokeWidth="40" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="630,90 700,150 620,180" fill="url(#arrowUpGradient)" />
        </g>
        {/* Orange Down Arrow */}
        <g className={styles.arrowDown}>
          <path d="M940 20 C 820 260, 600 320, 350 200" stroke="url(#arrowDownGradient)" strokeWidth="40" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="370,260 300,180 420,160" fill="url(#arrowDownGradient)" />
        </g>
        {/* Spiral */}
        <g className={styles.spiral}>
          <circle cx="500" cy="160" r="44" fill="url(#spiralGradient)" />
          <path d="M500 160 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" stroke="url(#spiralStroke)" strokeWidth="8" fill="none" />
          <path d="M500 160 m-24,0 a24,24 0 1,1 48,0 a24,24 0 1,1 -48,0" stroke="url(#spiralStroke2)" strokeWidth="5" fill="none" />
        </g>
        {/* Text */}
        <g className={styles.text}>
          <text x={faynoX} y="180" fontFamily="Montserrat,Arial,sans-serif" fontWeight="bold" fontSize="80" fill="url(#textGradient)" letterSpacing="6">FAYNO</text>
          <text x={syncX} y="180" fontFamily="Montserrat,Arial,sans-serif" fontWeight="bold" fontSize="80" fill="url(#textGradient2)" letterSpacing="6">SYNC</text>
        </g>
        <defs>
          <linearGradient id="arrowUpGradient" x1="160" y1="280" x2="450" y2="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A084F6" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="arrowDownGradient" x1="840" y1="60" x2="550" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB86C" />
            <stop offset="1" stopColor="#FF6A3D" />
          </linearGradient>
          <radialGradient id="spiralGradient" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0%" stopColor="#FFD580" />
            <stop offset="40%" stopColor="#FF6A3D" />
            <stop offset="80%" stopColor="#A084F6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </radialGradient>
          <linearGradient id="spiralStroke" x1="464" y1="160" x2="536" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB86C" />
            <stop offset="1" stopColor="#A084F6" />
          </linearGradient>
          <linearGradient id="spiralStroke2" x1="476" y1="160" x2="524" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6A3D" />
            <stop offset="1" stopColor="#FFD580" />
          </linearGradient>
          <linearGradient id="textGradient" x1="120" y1="180" x2="500" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A084F6" />
            <stop offset="1" stopColor="#FFB86C" />
          </linearGradient>
          <linearGradient id="textGradient2" x1="570" y1="180" x2="880" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFB86C" />
            <stop offset="0.5" stopColor="#FF6A3D" />
            <stop offset="1" stopColor="#6B1A00" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default AnimatedBanner; 