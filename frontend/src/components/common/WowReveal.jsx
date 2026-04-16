import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SELECTOR = '.wow';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const WowReveal = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const elements = Array.from(document.querySelectorAll(`${SELECTOR}:not([data-wow-processed])`));
    if (elements.length === 0) return undefined;

    for (const el of elements) {
      el.setAttribute('data-wow-processed', 'true');
      const delay = el.getAttribute('data-wow-delay');
      if (delay) el.style.setProperty('--wow-delay', delay);
      el.classList.add('wow-pending');
    }

    if (prefersReducedMotion()) {
      for (const el of elements) {
        el.classList.remove('wow-pending');
        el.classList.add('wow-visible');
      }
      return undefined;
    }

    if (typeof window.IntersectionObserver !== 'function') {
      for (const el of elements) {
        el.classList.remove('wow-pending');
        el.classList.add('wow-visible');
      }
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('wow-visible');
          entry.target.classList.remove('wow-pending');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [location.pathname, location.search]);

  return null;
};

export default WowReveal;
