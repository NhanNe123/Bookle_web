import React, { useState, useEffect } from 'react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setIsVisible(y > 300);

      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - doc.clientHeight);
      const p = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;
      setProgress(p);
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button 
      id="back-top" 
      className={`back-to-top ${isVisible ? 'show' : ''}`}
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      title="Lên đầu trang"
      style={{ '--progress': `${Math.round(progress * 100)}%` }}
    >
      <i className="fa-solid fa-chevron-up" aria-hidden="true"></i>
    </button>
  );
};

export default BackToTop;
