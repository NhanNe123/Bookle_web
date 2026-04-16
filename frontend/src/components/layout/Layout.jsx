import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Preloader from '../common/Preloader';
import BackToTop from '../common/BackToTop';
import CursorFollower from '../common/CursorFollower';
import WowReveal from '../common/WowReveal';
import Offcanvas from '../common/Offcanvas';
import DynamicDecoration from '../common/DynamicDecoration';
import LoginModal from '../auth/LoginModal';
import RegisterModal from '../auth/RegisterModal';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';
import { applyTheme } from '../../utils/themeEngine';

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [decorationType, setDecorationType] = useState('none');
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/events/active');
        const data = await res.json();
        if (cancelled || !data.success || !data.event) return;
        const ev = data.event;
        setActiveEvent(ev);
        if (ev.themeConfig) {
          applyTheme(ev.themeConfig);
          setDecorationType(ev.themeConfig.decorationType || 'none');
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleOffcanvasToggle = () => {
    setIsOffcanvasOpen(!isOffcanvasOpen);
  };

  const handleShowLogin = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  const handleShowRegister = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  const handleCloseModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(false);
  };

  const handleShowForgotPassword = () => {
    setShowForgotPasswordModal(true);
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  return (
    <>
      {isLoading && <Preloader />}
      <DynamicDecoration type={decorationType} />
      <WowReveal />
      <CursorFollower />
      <BackToTop />
      <Offcanvas isOpen={isOffcanvasOpen} onClose={() => setIsOffcanvasOpen(false)} />
      <Header 
        onToggleSidebar={handleOffcanvasToggle}
        onShowLogin={handleShowLogin}
      />
      {activeEvent?.suggestedSlogan && (
        <div
          style={{
            background: `linear-gradient(90deg, var(--primary-color, #036280), var(--secondary-color, #ff6500))`,
            color: '#fff',
            textAlign: 'center',
            padding: '10px 16px',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: 0.5,
            position: 'relative',
            zIndex: 100,
          }}
        >
          <span style={{ marginRight: 8 }}>🎉</span>
          {activeEvent.suggestedSlogan}
          {activeEvent.discountConfig?.discountPercent > 0 && (
            <span
              style={{
                marginLeft: 12,
                background: 'rgba(255,255,255,0.25)',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 13,
              }}
            >
              Giảm {activeEvent.discountConfig.discountPercent}%
            </span>
          )}
        </div>
      )}
      <main>
        <Outlet />
      </main>
      <Footer />
      
      {/* Auth Modals */}
      {showLoginModal && (
        <LoginModal 
          onSwitchToRegister={handleShowRegister}
          onClose={handleCloseModals}
          onShowForgotPassword={handleShowForgotPassword}
        />
      )}
      {showRegisterModal && (
        <RegisterModal 
          onSwitchToLogin={handleShowLogin}
          onClose={handleCloseModals}
        />
      )}
      {showForgotPasswordModal && (
        <ForgotPasswordModal 
          onBackToLogin={handleShowLogin}
          onClose={handleCloseModals}
        />
      )}
    </>
  );
};

export default Layout;
