import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '50px',
  enabled = true,
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        // Once visible, keep it visible (for performance)
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, isVisible]);

  return {
    ref: targetRef,
    isIntersecting,
    isVisible,
  };
}