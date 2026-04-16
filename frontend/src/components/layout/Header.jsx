import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import { getProducts } from '../../lib/api';
import { getProductImage } from '../../utils/categoryUtils';
import AIChatAssistant from '../common/AIChatAssistant';

const Header = ({ onToggleSidebar, onShowLogin }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { cart, getCartCount } = useCart();
  const { wishlist, getWishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  /** Khi mở chat từ trang chi tiết sách — gửi kèm API để server nạp mô tả đầy đủ */
  const [aiPageBookContext, setAiPageBookContext] = useState(null);
  const languageDropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSearchSource, setActiveSearchSource] = useState(null); // 'sticky' | 'main'
  const searchStickyRef = useRef(null);
  const searchMainRef = useRef(null);
  const searchRef = useRef(null); // backward compat
  const searchTimerRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await getProducts({ q: q.trim(), limit: 5 });
      setSearchResults(data.items || []);
      setShowSearchResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = () => {
    setShowSearchResults(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inSticky = searchStickyRef.current?.contains(e.target);
      const inMain = searchMainRef.current?.contains(e.target);
      if (!inSticky && !inMain) {
        setShowSearchResults(false);
        setActiveSearchSource(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('bookle_language', lang);
    setShowLanguageDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  useEffect(() => {
    const onOpenFromProduct = (e) => {
      const d = e.detail || {};
      setAiPageBookContext(
        d.contextProductId && d.productName
          ? { id: d.contextProductId, name: d.productName }
          : null
      );
      setShowAIChat(true);
    };
    window.addEventListener('bookle:open-ai-chat', onOpenFromProduct);
    return () => window.removeEventListener('bookle:open-ai-chat', onOpenFromProduct);
  }, []);

  const renderSearchBox = (source) => {
    const ref = source === 'sticky' ? searchStickyRef : searchMainRef;
    const showDropdown = showSearchResults && activeSearchSource === source;

    return (
      <div className="col-3 col-lg-3 d-none d-lg-block">
        <div className="header-search-box" ref={ref}>
          <form onSubmit={handleSearchSubmit} className="header-search-form">
            <input
              type="text"
              placeholder={t('header.search.placeholder', 'Tìm sách...')}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                setActiveSearchSource(source);
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              className="header-search-input"
            />
            <button type="submit" className="header-search-btn">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </form>
          {showDropdown && (
            <div className="header-search-dropdown">
              {searchLoading && <div className="header-search-loading">Đang tìm...</div>}
              {!searchLoading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                <div className="header-search-empty">Không tìm thấy sách nào</div>
              )}
              {searchResults.map((item) => (
                <Link
                  key={item._id}
                  to={`/shop-details/${item.slug || item._id}`}
                  className="header-search-item"
                  onClick={handleResultClick}
                >
                  <img
                    src={getProductImage(item.images, item.coverImage)}
                    alt={item.name}
                    className="header-search-item-img"
                  />
                  <div className="header-search-item-info">
                    <div className="header-search-item-name">{item.name}</div>
                    {item.author && <div className="header-search-item-author">{item.author}</div>}
                    <div className="header-search-item-price">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </div>
                  </div>
                </Link>
              ))}
              {searchResults.length > 0 && (
                <Link
                  to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                  className="header-search-viewall"
                  onClick={handleResultClick}
                >
                  Xem tất cả kết quả <i className="fa-solid fa-arrow-right"></i>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header Top Section */}
      <div className="header-top-1">
        <div className="container">
          <div className="header-top-wrapper">
            <ul className="contact-list">
              <li>
                <i className="fa-regular fa-phone"></i>
                <a href="tel:+20866660112">038-346-1187</a>
              </li>
              <li>
                <i className="far fa-envelope"></i>
                <a href="mailto:kimhung@gmail.com">kimhung@gmail.com</a>
              </li>
              <li>
                <i className="far fa-clock"></i>
                <span>{t('header.top.workingHours')}</span>
              </li>
            </ul>
            <ul className="list">
              <li>
                <i className="fa-solid fa-robot" style={{ color: 'var(--white)' }}></i>
                <button 
                  type="button"
                  onClick={() => {
                    setAiPageBookContext(null);
                    setShowAIChat(true);
                  }}
                  className="ai-contact-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--white)',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.color = 'var(--link-hover)'; }}
                  onMouseLeave={(e) => { e.target.style.color = 'var(--white)'; }}
                >
                  Liên Hệ Trực Tiếp Với AI
                </button>
              </li>
              {/* Language Switcher */}
              <li>
                <div 
                  ref={languageDropdownRef}
                  className="dropdown d-inline-block"
                  style={{ position: 'relative' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="border-0 bg-transparent"
                    style={{
                      color: 'var(--white)',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-globe" style={{ fontSize: '16px' }}></i>
                    <span style={{ fontSize: '14px' }}>{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
                    <i className={`fas fa-angle-down ${showLanguageDropdown ? 'rotate-180' : ''}`} style={{ 
                      fontSize: '12px', 
                      marginLeft: '3px',
                      transition: 'transform 0.3s ease'
                    }}></i>
                  </button>
                  {showLanguageDropdown && (
                    <ul
                      className="dropdown-menu show"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        marginTop: '5px',
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-2)',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '150px',
                        padding: '5px 0',
                        zIndex: 1000,
                        animation: 'fadeIn 0.2s ease-in'
                      }}
                    >
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => changeLanguage('vi')}
                          style={{
                            color: i18n.language === 'vi' ? 'var(--primary-color)' : 'var(--dropdown-text)',
                            padding: '8px 16px',
                            background: 'transparent',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontWeight: i18n.language === 'vi' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--surface-hover)'; }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                        >
                          <i className="fa-solid fa-check" style={{ 
                            opacity: i18n.language === 'vi' ? 1 : 0,
                            width: '16px'
                          }}></i>
                          <span>{t('language.vietnamese')}</span>
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => changeLanguage('en')}
                          style={{
                            color: i18n.language === 'en' ? 'var(--primary-color)' : 'var(--dropdown-text)',
                            padding: '8px 16px',
                            background: 'transparent',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontWeight: i18n.language === 'en' ? '600' : '400',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--surface-hover)'; }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                        >
                          <i className="fa-solid fa-check" style={{ 
                            opacity: i18n.language === 'en' ? 1 : 0,
                            width: '16px'
                          }}></i>
                          <span>{t('language.english')}</span>
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </li>
              <li>
                <i className="fa-light fa-user"></i>
                {isAuthenticated ? (
                  <div className="dropdown d-inline-block">
                    <button 
                      className="dropdown-toggle border-0 bg-transparent" 
                      type="button" 
                      id="userDropdown" 
                      data-bs-toggle="dropdown"
                      style={{ 
                        color: 'var(--white)',
                        fontWeight: '500'
                      }}
                    >
                      {t('header.top.welcome')}, {user?.name || user?.email}
                    </button>
                    <ul 
                      className="dropdown-menu"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-2)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '200px'
                      }}
                    >
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/profile"
                          style={{ color: 'var(--dropdown-text)', padding: '8px 16px' }}
                        >
                          <i className="fa-solid fa-user me-2"></i> {t('header.top.myAccount')}
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/wishlist"
                          style={{ color: 'var(--dropdown-text)', padding: '8px 16px' }}
                        >
                          <i className="fa-solid fa-heart me-2"></i> {t('header.top.wishlist')}
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/shop-cart"
                          style={{ color: 'var(--dropdown-text)', padding: '8px 16px' }}
                        >
                          <i className="fa-solid fa-shopping-cart me-2"></i> {t('header.top.cart')}
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item" 
                          onClick={logout}
                          style={{ 
                            color: 'var(--danger-color)', 
                            padding: '8px 16px',
                            background: 'transparent',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fa-solid fa-right-from-bracket me-2"></i> {t('header.top.logout')}
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={onShowLogin}
                    data-bs-toggle="modal"
                    data-bs-target="#loginModal"
                  >
                    {t('header.top.login')}
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sticky Header Section */}
      <header className="header-1 sticky-header">
        <div className="mega-menu-wrapper">
          <div className="header-main">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-2 col-lg-2">
                  <div className="header-left">
                    <div className="logo">
                      <Link to="/" className="header-logo">
                        <img src="/assets/img/logo/white-logo.svg" alt="logo-img" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-5 col-lg-5">
                  <div className="mean__menu-wrapper d-flex justify-content-center">
                    <div className="main-menu">
                      <nav>
                        <ul>
                          <li>
                            <Link to="/">
                              {t('header.menu.home')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/">{t('header.menu.home')}</Link></li>
                              <li><Link to="/news">{t('header.menu.latest')}</Link></li>
                            </ul>
                          </li>
                          <li>
                            <Link to="/shop">
                              {t('header.menu.shop')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/shop">{t('header.menu.shop')}</Link></li>
                              <li><Link to="/shop-list">{t('header.menu.shopList')}</Link></li>
                            </ul>
                          </li>
                          <li className="has-dropdown">
                            <Link to="/about">
                              {t('header.menu.pages')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/about">{t('header.menu.about')}</Link></li>
                              <li><Link to="/authors">{t('header.menu.authors') || 'Tác giả'}</Link></li>
                              <li><Link to="/faq">{t('header.menu.faq')}</Link></li>
                            </ul>
                          </li>
                          <li>
                            <Link to="/news">
                              {t('header.menu.news')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/news">{t('header.menu.news')}</Link></li>
                              <li><Link to="/news">{t('header.menu.blog')}</Link></li>
                            </ul>
                          </li>
                          <li>
                            <Link to="/contact">{t('header.menu.contact')}</Link>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
                {renderSearchBox('sticky')}
                <div className="col-2 col-lg-2">
                  <div className="header-right d-flex justify-content-end">
                    <div className="menu-cart">
                      <Link 
                        to="/wishlist" 
                        className="cart-icon"
                        data-count={wishlistCount > 99 ? '99+' : wishlistCount}
                      >
                        <i className="fa-regular fa-heart"></i>
                      </Link>
                      <Link 
                        to="/shop-cart" 
                        className="cart-icon"
                        data-count={cartCount > 99 ? '99+' : cartCount}
                      >
                        <i className="fa-regular fa-cart-shopping"></i>
                      </Link>
                      <div className="header-humbager ml-30">
                        <a className="sidebar__toggle" href="#" onClick={(e) => {
                          e.preventDefault();
                          onToggleSidebar();
                        }}>
                          <div className="bar-icon-2">
                            <img src="/assets/img/icon/icon-13.svg" alt="img" />
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Header Section */}
      <header className="header-1">
        <div className="mega-menu-wrapper">
          <div className="header-main">
            <div className="container">
              <div className="row align-items-center">
                <div className="col-2 col-lg-2">
                  <div className="header-left">
                    <div className="logo">
                      <Link to="/" className="header-logo">
                        <img src="/assets/img/logo/white-logo.svg" alt="logo-img" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-5 col-lg-5">
                  <div className="mean__menu-wrapper d-flex justify-content-center">
                    <div className="main-menu">
                      <nav id="mobile-menu">
                        <ul>
                          <li>
                            <Link to="/">
                              {t('header.menu.home')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/">{t('header.menu.home')}</Link></li>
                              <li><Link to="/news">{t('header.menu.latest')}</Link></li>
                            </ul>
                          </li>
                          <li>
                            <Link to="/shop">
                              {t('header.menu.shop')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/shop">{t('header.menu.shop')}</Link></li>
                              <li><Link to="/shop-list">{t('header.menu.shopList')}</Link></li>
                            </ul>
                          </li>
                          <li className="has-dropdown">
                            <Link to="/about">
                              {t('header.menu.pages')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/about">{t('header.menu.about')}</Link></li>
                              <li><Link to="/authors">{t('header.menu.authors') || 'Tác giả'}</Link></li>
                              <li><Link to="/faq">{t('header.menu.faq')}</Link></li>
                            </ul>
                          </li>
                          <li>
                            <Link to="/news">
                              {t('header.menu.news')}
                              <i className="fas fa-angle-down"></i>
                            </Link>
                            <ul className="submenu">
                              <li><Link to="/news">{t('header.menu.news')}</Link></li>
                              <li><Link to="/news">{t('header.menu.blog')}</Link></li>
                            </ul>
                          </li>
                          <li>
                            <Link to="/contact">{t('header.menu.contact')}</Link>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
                {renderSearchBox('main')}
                <div className="col-2 col-lg-2">
                  <div className="header-right d-flex justify-content-end">
                    <div className="menu-cart">
                      <Link 
                        to="/wishlist" 
                        className="cart-icon"
                        data-count={wishlistCount > 99 ? '99+' : wishlistCount}
                      >
                        <i className="fa-regular fa-heart"></i>
                      </Link>
                      <Link 
                        to="/shop-cart" 
                        className="cart-icon"
                        data-count={cartCount > 99 ? '99+' : cartCount}
                      >
                        <i className="fa-regular fa-cart-shopping"></i>
                      </Link>
                      <div className="header-humbager ml-30">
                        <a className="sidebar__toggle" href="#" onClick={(e) => {
                          e.preventDefault();
                          onToggleSidebar();
                        }}>
                          <div className="bar-icon-2">
                            <img src="/assets/img/icon/icon-13.svg" alt="img" />
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* AI Chat Assistant */}
      <AIChatAssistant
        isOpenExternal={showAIChat}
        pageBookContext={aiPageBookContext}
        onClose={() => {
          setShowAIChat(false);
          setAiPageBookContext(null);
        }}
      />
    </>
  );
};

export default Header;
