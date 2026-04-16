import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getBookLanguages } from '../lib/api';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { formatCategoryName, getProductImage } from '../utils/categoryUtils';
import { getCategoryGroups } from '../config/categories';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RecentlyViewedSidebar from '../components/common/RecentlyViewedSidebar';

const ShopListPage = () => {
  const { t, i18n } = useTranslation();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const PRICE_LIMITS = {
    min: 0,
    max: 1000000,
    step: 50000,
  };

  const formatCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Language display mapping
  const languageFlags = {
    'vi': '🇻🇳',
    'en': '🇬🇧',
    'zh': '🇨🇳',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'es': '🇪🇸',
    'ru': '🇷🇺',
    'th': '🇹🇭'
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('random');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({
    min: PRICE_LIMITS.min,
    max: PRICE_LIMITS.max,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showNotification, setShowNotification] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Get category groups (memoized to prevent re-renders)
  const categoryGroups = React.useMemo(() => getCategoryGroups(), []);

  // Fetch available book languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await getBookLanguages();
        if (data.success && data.languages) {
          setAvailableLanguages(data.languages);
        }
      } catch (err) {
        console.error('Error fetching languages:', err);
      }
    };
    fetchLanguages();
  }, []);

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchQuery, selectedCategory, priceRange.min, priceRange.max, selectedLanguage, sortBy]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: pagination.page,
          limit: 12,
        };
        
        if (searchQuery) params.q = searchQuery;
        if (selectedCategory !== 'all') {
          const group = categoryGroups.find(g => g.id === selectedCategory);
          if (group) {
            params.categoryGroup = selectedCategory;
          } else {
            params.category = selectedCategory;
          }
        }
        if (priceRange.min > PRICE_LIMITS.min) params.minPrice = priceRange.min;
        if (priceRange.max < PRICE_LIMITS.max) params.maxPrice = priceRange.max;
        if (selectedLanguage !== 'all') params.language = selectedLanguage;
        params.sortBy = sortBy;
        
        const data = await getProducts(params);
        setProducts(data.items || []);
        setPagination({
          page: data.page || 1,
          pages: data.pages || 1,
          total: data.total || 0
        });
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(t('shop.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [pagination.page, searchQuery, selectedCategory, priceRange.min, priceRange.max, selectedLanguage, sortBy, categoryGroups, t]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handlePriceRangeChange = (type, value) => {
    const numericValue = Number(value);

    setPriceRange(prev => {
      const updated = {
        ...prev,
        [type]: numericValue,
      };

      if (type === 'min' && numericValue > prev.max) {
        updated.max = numericValue;
      }

      if (type === 'max' && numericValue < prev.min) {
        updated.min = numericValue;
      }

      return updated;
    });
  };

  const handleAddToCart = (product) => {
    if (product.isAvailable && product.stock > 0) {
      addToCart(product, 1);
      setShowNotification({ [product._id]: true });
      setTimeout(() => {
        setShowNotification(prev => ({ ...prev, [product._id]: false }));
      }, 2000);
    }
  };

  return (
    <>
      {/* Breadcrumb Section */}
      <div className="breadcrumb-wrapper">
        <div className="book1">
          <img src="/assets/img/hero/book1.png" alt="book" />
        </div>
        <div className="book2">
          <img src="/assets/img/hero/book2.png" alt="book" />
        </div>
        <div className="container">
          <div className="page-heading">
            <h1>{t('shop.listTitle') || 'Danh sách sách'}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{t('common.home') || 'Trang chủ'}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{t('shop.listTitle') || 'Danh sách sách'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="shop-section fix section-padding">
        <div className="container">
          <div className="shop-default-wrapper">
            <div className="row">
              <div className="col-12">
                <div className="woocommerce-notices-wrapper wow fadeInUp" data-wow-delay=".3s">
                  <p id="resultCount">
                    {loading ? t('shop.loading') : `${t('shop.showing')} ${products.length} ${t('shop.of')} ${pagination.total} ${t('shop.products')}`}
                  </p>
                  <div className="form-clt">
                    <div className="sort-select-wrapper">
                      <select 
                        key={`sort-${i18n.language}`}
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-select"
                        style={{ 
                          padding: '10px 35px 10px 15px',
                          borderRadius: '8px',
                          border: '1px solid #e5e5e5',
                          fontSize: '14px',
                          minWidth: '180px',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23666\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                          backgroundSize: '20px'
                        }}
                      >
                        <option value="random">{t('shop.sortBy.random')}</option>
                        <option value="latest">{t('shop.sortBy.latest')}</option>
                        <option value="oldest">{t('shop.sortBy.oldest')}</option>
                        <option value="popularity">{t('shop.sortBy.popularity')}</option>
                        <option value="rating">{t('shop.sortBy.rating')}</option>
                        <option value="price-low">{t('shop.sortBy.priceLow')}</option>
                        <option value="price-high">{t('shop.sortBy.priceHigh')}</option>
                        <option value="name-asc">{t('shop.sortBy.nameAsc')}</option>
                        <option value="name-desc">{t('shop.sortBy.nameDesc')}</option>
                      </select>
                    </div>
                    <div className="icon">
                      <Link 
                        to="/shop-list" 
                        className="active"
                      >
                        <i className="fas fa-list"></i>
                      </Link>
                    </div>
                    <div className="icon-2">
                      <Link to="/shop">
                        <i className="fa-sharp fa-regular fa-grid-2"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-4 order-2 order-md-1 wow fadeInUp" data-wow-delay=".3s">
                <div className="main-sidebar">
                  {/* Search Widget */}
                  <div className="single-sidebar-widget">
                    <div className="wid-title">
                      <h5>{t('shop.search')}</h5>
                    </div>
                    <form onSubmit={handleSearch} className="search-toggle-box">
                      <div className="input-area search-container">
                        <input 
                          className="search-input" 
                          type="text" 
                          placeholder={t('shop.searchPlaceholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="cmn-btn search-icon" type="submit">
                          <i className="far fa-search"></i>
                        </button>
                      </div>
                    </form>
                  </div>

                  <RecentlyViewedSidebar />

                  {/* Categories Widget */}
                  <div className="single-sidebar-widget">
                    <div className="wid-title">
                      <h5>{t('shop.categories')}</h5>
                    </div>
                    <div className="categories-list">
                      {/* All Categories Button */}
                      <button 
                        className={`nav-link w-100 text-start mb-2 ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedGroup(null);
                        }}
                        type="button"
                        style={{ 
                          border: '1px solid #e5e5e5', 
                          borderRadius: '8px',
                          padding: '10px 15px',
                          background: selectedCategory === 'all' ? 'var(--theme, #036280)' : '#fff',
                          color: selectedCategory === 'all' ? '#fff' : 'var(--text, #4F536C)',
                          fontWeight: '600'
                        }}
                      >
                        {t('shop.categoryNames.all')}
                      </button>

                      {/* Category Groups Accordion */}
                      <div className="accordion accordion-flush" id="categoryAccordion">
                        {categoryGroups.map((group, index) => {
                          const isGroupSelected = selectedCategory === group.id;
                          const hasSelectedSubcategory = group.subcategories.some(
                            sub => selectedCategory === sub.id
                          );
                          const isExpanded = expandedGroups[group.id] || false;

                          return (
                            <div key={group.id} className="accordion-item" style={{ 
                              border: '1px solid #e5e5e5', 
                              borderRadius: '8px',
                              marginBottom: '8px',
                              overflow: 'hidden'
                            }}>
                              <h2 className="accordion-header" id={`heading-${group.id}`}>
                                <button
                                  className={`accordion-button ${isExpanded ? '' : 'collapsed'}`}
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target={`#collapse-${group.id}`}
                                  aria-expanded={isExpanded ? 'true' : 'false'}
                                  aria-controls={`collapse-${group.id}`}
                                  onClick={() => {
                                    setExpandedGroups(prev => ({
                                      ...prev,
                                      [group.id]: !prev[group.id]
                                    }));
                                    if (!isExpanded) {
                                      setSelectedCategory(group.id);
                                      setSelectedGroup(group.id);
                                    }
                                  }}
                                  style={{
                                    background: isGroupSelected || hasSelectedSubcategory 
                                      ? 'var(--theme, #036280)' 
                                      : '#fff',
                                    color: isGroupSelected || hasSelectedSubcategory 
                                      ? '#fff' 
                                      : 'var(--text, #4F536C)',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    padding: '12px 15px',
                                    boxShadow: 'none'
                                  }}
                                >
                                  {t(group.nameKey) || group.name}
                                </button>
                              </h2>
                              <div
                                id={`collapse-${group.id}`}
                                className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}
                                aria-labelledby={`heading-${group.id}`}
                                data-bs-parent="#categoryAccordion"
                              >
                                <div className="accordion-body" style={{ padding: '8px 15px' }}>
                                  {group.subcategories.map((subcategory) => (
                                    <button
                                      key={subcategory.id}
                                      className="w-100 text-start"
                                      onClick={() => {
                                        setSelectedCategory(subcategory.id);
                                        setSelectedGroup(null);
                                      }}
                                      type="button"
                                      style={{
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        marginBottom: '4px',
                                        background: selectedCategory === subcategory.id 
                                          ? 'rgba(3, 98, 128, 0.1)' 
                                          : 'transparent',
                                        color: selectedCategory === subcategory.id 
                                          ? 'var(--theme, #036280)' 
                                          : 'var(--text, #4F536C)',
                                        fontWeight: selectedCategory === subcategory.id ? '600' : '400',
                                        fontSize: '14px',
                                        textAlign: 'left',
                                        width: '100%',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (selectedCategory !== subcategory.id) {
                                          e.target.style.background = 'rgba(3, 98, 128, 0.05)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (selectedCategory !== subcategory.id) {
                                          e.target.style.background = 'transparent';
                                        }
                                      }}
                                    >
                                      {t(subcategory.nameKey) || subcategory.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Price Range Widget */}
                  <div className="single-sidebar-widget mb-50">
                    <div className="wid-title">
                      <h5>{t('shop.filterByPrice')}</h5>
                    </div>
                    <div className="range__barcustom">
                      <div className="slider">
                        <div 
                          className="progress" 
                          style={{
                            left: `${(priceRange.min / PRICE_LIMITS.max) * 100}%`,
                            right: `${100 - (priceRange.max / PRICE_LIMITS.max) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="range-input">
                        <input 
                          type="range" 
                          className="range-min" 
                          min={PRICE_LIMITS.min}
                          max={PRICE_LIMITS.max}
                          step={PRICE_LIMITS.step}
                          value={priceRange.min}
                          onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                        />
                        <input 
                          type="range" 
                          className="range-max" 
                          min={PRICE_LIMITS.min + PRICE_LIMITS.step}
                          max={PRICE_LIMITS.max} 
                          step={PRICE_LIMITS.step}
                          value={priceRange.max}
                          onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                        />
                      </div>
                      <div className="range-items">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold">{t('shop.minPrice')}</span>
                          <span className="fw-bold" style={{ color: 'var(--text, #4F536C)' }}>{formatCurrency(priceRange.min)}₫</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="fw-semibold">{t('shop.maxPrice')}</span>
                          <span className="fw-bold" style={{ color: 'var(--text, #4F536C)' }}>{formatCurrency(priceRange.max)}₫</span>
                        </div>
                        <div className="mt-3 p-2 bg-light rounded text-center">
                          <small className="text-muted">{t('shop.priceRange')}</small>
                          <div className="fw-bold" style={{ color: 'var(--text, #4F536C)' }}>
                            {formatCurrency(priceRange.min)}₫ - {formatCurrency(priceRange.max)}₫
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Language Filter Widget */}
                  <div className="single-sidebar-widget">
                    <div className="wid-title">
                      <h5>{t('shop.filterByLanguage')}</h5>
                    </div>
                    <div className="language-filter-list">
                      <button
                        className={`language-btn w-100 text-start mb-2 ${selectedLanguage === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedLanguage('all')}
                        type="button"
                        style={{ 
                          border: '1px solid #e5e5e5', 
                          borderRadius: '8px',
                          padding: '10px 15px',
                          background: selectedLanguage === 'all' ? 'var(--theme, #036280)' : '#fff',
                          color: selectedLanguage === 'all' ? '#fff' : 'var(--text, #4F536C)',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <i className="fa-solid fa-globe me-2"></i>
                        {t('shop.allLanguages')}
                      </button>
                      {availableLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          className={`language-btn w-100 text-start mb-2 ${selectedLanguage === lang.code ? 'active' : ''}`}
                          onClick={() => setSelectedLanguage(lang.code)}
                          type="button"
                          style={{
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            background: selectedLanguage === lang.code ? 'var(--theme, #036280)' : '#fff',
                            color: selectedLanguage === lang.code ? '#fff' : 'var(--text, #4F536C)',
                            fontWeight: '500',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>
                            <i className="fa-solid fa-book me-2"></i>
                            {t(`shop.bookLanguages.${lang.code}`) || lang.name}
                          </span>
                          <span 
                            className="badge"
                            style={{
                              background: selectedLanguage === lang.code ? 'rgba(255,255,255,0.2)' : 'rgba(3, 98, 128, 0.1)',
                              color: selectedLanguage === lang.code ? '#fff' : 'var(--theme, #036280)',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          >
                            {lang.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-9 col-lg-8 order-1 order-md-2">
                <div className="shop-wrapper">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  {loading ? (
                    <div className="text-center py-5">
                      <LoadingSpinner size="large" variant="spinner" text={t('shop.loading')} />
                    </div>
                  ) : (
                    <>
                      <div className="shop-list-wrapper">
                        {products.map((product) => {
                          const {
                            _id,
                            slug,
                            name,
                            author,
                            price,
                            compareAtPrice,
                            images = [],
                            coverImage = '',
                            rating = 0,
                            isHot,
                            categories = [],
                            stock = 0,
                            isAvailable = true,
                            shortDescription = '',
                            description = '',
                            language = 'vi'
                          } = product;

                          const image = getProductImage(images, coverImage);
                          const discount = compareAtPrice ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
                          const productUrl = `/shop-details/${slug || _id}`;
                          const productDescription = shortDescription || description || t('shop.noDescription') || 'Chưa có mô tả cho sản phẩm này.';

                          return (
                            <div key={_id} className="shop-list-items">
                              <div className="shop-list-thumb">
                                <Link to={productUrl} className="book-cover-frame-link">
                                  <img
                                    className="book-cover-img"
                                    src={image}
                                    alt={name}
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </Link>
                                {(isHot || discount > 0 || language) && (
                                  <ul className="post-box">
                                    {isHot && <li>Hot</li>}
                                    {discount > 0 && <li>-{discount}%</li>}
                                    {language && languageFlags[language] && (
                                      <li title={t(`shop.bookLanguages.${language}`) || language} style={{ fontSize: '14px' }}>
                                        {languageFlags[language]}
                                      </li>
                                    )}
                                  </ul>
                                )}
                                {!isAvailable && (
                                  <div className="position-absolute top-50 start-50 translate-middle bg-danger text-white px-3 py-2 rounded">
                                    {t('shop.outOfStock')}
                                  </div>
                                )}
                              </div>
                              <div className="shop-list-content">
                                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                                  <Link to={productUrl} style={{ color: '#1a1a2e' }}>{name}</Link>
                                </h3>
                                {categories.length > 0 && (
                                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                    <Link to="/shop" style={{ color: '#666' }}>{formatCategoryName(categories[0])}</Link>
                                  </p>
                                )}
                                <div className="star">
                                  {[...Array(5)].map((_, index) => (
                                    <i 
                                      key={index} 
                                      className={index < Math.floor(rating) ? "fa-solid fa-star" : "fa-regular fa-star"}
                                    ></i>
                                  ))}
                                </div>
                                <p>{productDescription.length > 150 ? `${productDescription.substring(0, 150)}...` : productDescription}</p>
                                <ul className="price-list">
                                  {compareAtPrice && (
                                    <li>
                                      <del>{formatPrice(compareAtPrice)}</del>
                                    </li>
                                  )}
                                  <li>{formatPrice(price)}</li>
                                </ul>
                                {author && (
                                  <ul className="author-post">
                                    <li className="authot-list">
                                      <span className="text">{t('shop.author')}</span>
                                      <span className="author">{author}</span>
                                    </li>
                                  </ul>
                                )}
                                <div className="shop-btn">
                                  <button 
                                    className="theme-btn" 
                                    onClick={() => handleAddToCart(product)}
                                    disabled={!isAvailable || stock <= 0}
                                  >
                                    <i className="fa-solid fa-basket-shopping"></i>
                                    {!isAvailable || stock <= 0 ? t('shop.outOfStock') : isInCart(_id) ? t('shop.addMore') : t('shop.addToCart')}
                                  </button>
                                  {showNotification[product._id] && (
                                    <div 
                                      className="position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-success py-2 px-3" 
                                      style={{ zIndex: 1100, whiteSpace: 'nowrap' }}
                                    >
                                      {t('shop.addedToCart')}
                                    </div>
                                  )}
                                  <ul className="shop-icon d-flex gap-2">
                                    <li>
                                      <a 
                                        href="#" 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          toggleWishlist(product);
                                        }}
                                        className={isInWishlist(_id) ? 'text-danger' : ''}
                                        title={isInWishlist(_id) ? t('shop.removeFromWishlist') : t('shop.addToWishlist')}
                                      >
                                        <i className={isInWishlist(_id) ? "fas fa-heart" : "far fa-heart"}></i>
                                      </a>
                                    </li>
                                    <li>
                                      <a 
                                        href="#" 
                                        onClick={(e) => {
                                          e.preventDefault();
                                        }}
                                      >
                                        <img className="icon" src="/assets/img/icon/shuffle.svg" alt="svg-icon" />
                                      </a>
                                    </li>
                                    <li>
                                      <Link to={productUrl}>
                                        <i className="far fa-eye"></i>
                                      </Link>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Pagination */}
                      <Pagination 
                        pagination={pagination}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                      />
                    </>
                  )}
                  {!loading && !error && products.length === 0 && (
                    <div className="text-center py-5">
                      <p>{t('shop.noProducts')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopListPage;
