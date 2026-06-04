'use client';

import { useEffect, useState } from 'react';

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Проверяем поддержку animation-timeline
    const test = 'animationTimeline' in document.documentElement.style;
    setSupported(test);

    if (!test) {
      // Fallback для неподдерживаемых браузеров
      const handleScroll = () => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        setProgress(scrolled);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (!supported) {
    return (
      <div 
        className="fixed top-16 left-0 right-0 h-1 bg-[#bb3bf6] z-50 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    );
  }

  return <div className="progress-bar bg-[#7f19f3]" />;
}