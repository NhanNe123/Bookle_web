import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Preloader from '../common/Preloader';
import BackToTop from '../common/BackToTop';
import CursorFollower from '../common/CursorFollower';
import Offcanvas from '../common/Offcanvas';
import LoginModal from '../auth/LoginModal';
import RegisterModal from '../auth/RegisterModal';
import ForgotPasswordModal from '../auth/ForgotPasswordModal';

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
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
      <CursorFollower />
      <BackToTop />
      <Offcanvas isOpen={isOffcanvasOpen} onClose={() => setIsOffcanvasOpen(false)} />
      <Header 
        onToggleSidebar={handleOffcanvasToggle}
        onShowLogin={handleShowLogin}
      />
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
