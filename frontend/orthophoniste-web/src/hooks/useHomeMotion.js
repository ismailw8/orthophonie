import { useEffect } from 'react';

// Content stays visible until motion and viewport observation are available.
export function useHomeMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!root || !preference || preference.matches || !window.IntersectionObserver) return;

    const elements = [...root.querySelectorAll('.home-facts, .home-section-heading, .home-service, .home-journey-heading, .home-steps > li, .home-faq > div, .home-contact')];
    const observer = new window.IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    for (const element of elements) {
      // Preserve content already on screen or above a restored scroll position.
      if (element.getBoundingClientRect().top < window.innerHeight) continue;
      element.classList.add('home-motion-reveal');
      observer.observe(element);
    }
    const revealFocusedElement = event => {
      const element = event.target.closest('.home-motion-reveal');
      if (!element) return;
      element.classList.add('is-visible');
      observer.unobserve(element);
    };
    const reset = () => {
      observer.disconnect();
      for (const element of elements) element.classList.remove('home-motion-reveal', 'is-visible');
    };
    const updatePreference = event => { if (event.matches) reset(); };
    root.addEventListener('focusin', revealFocusedElement);
    preference.addEventListener('change', updatePreference);
    return () => {
      reset();
      root.removeEventListener('focusin', revealFocusedElement);
      preference.removeEventListener('change', updatePreference);
    };
  }, [rootRef]);
}
