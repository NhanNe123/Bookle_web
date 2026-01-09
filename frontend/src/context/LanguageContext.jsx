import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

const translations = {
  vi: {
    // Header
    home: 'Trang chủ',
    shop: 'Cửa hàng',
    pages: 'Trang',
    about: 'Về chúng tôi',
    team: 'Tác giả',
    teamDetails: 'Hồ sơ tác giả',
    faq: 'Câu hỏi thường gặp',
    news: 'Tin tức',
    blog: 'Blog',
    contact: 'Liên hệ',
    // Common
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    search: 'Tìm kiếm',
    cart: 'Giỏ hàng',
    wishlist: 'Yêu thích',
    // Auth
    welcome: 'Xin chào',
    myAccount: 'Tài khoản của tôi',
    // Language
    language: 'Ngôn ngữ',
    vietnamese: 'Tiếng Việt',
    english: 'English',
  },
  en: {
    // Header
    home: 'Home',
    shop: 'Shop',
    pages: 'Pages',
    about: 'About Us',
    team: 'Authors',
    teamDetails: 'Author Profile',
    faq: 'FAQ',
    news: 'News',
    blog: 'Blog',
    contact: 'Contact',
    // Common
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    search: 'Search',
    cart: 'Cart',
    wishlist: 'Wishlist',
    // Auth
    welcome: 'Welcome',
    myAccount: 'My Account',
    // Language
    language: 'Language',
    vietnamese: 'Tiếng Việt',
    english: 'English',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load from localStorage or default to Vietnamese
    const savedLanguage = localStorage.getItem('bookle_language');
    return savedLanguage || 'vi';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('bookle_language', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    translations: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

