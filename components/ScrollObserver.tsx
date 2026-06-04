'use client';

import { useEffect, useRef } from 'react';

export default function ScrollObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Проверяем поддержку animation-timeline
    const supportsAnimationTimeline = 'animationTimeline' in document.documentElement.style;
    
    if (!supportsAnimationTimeline) {
      // Fallback с Intersection Observer
      const cards = document.querySelectorAll('.post-card');
      
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        },
        { threshold: 0.1 } // Срабатывает когда 10% карточки видно
      );
      
      cards.forEach((card) => observerRef.current?.observe(card));
    }
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return null;
}