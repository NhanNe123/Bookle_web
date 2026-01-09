import React, { useState, useEffect } from 'react';
import ProductCard from '../components/product/ProductCard';
import { Link } from 'react-router-dom';
import { getProducts } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { CATEGORY_GROUPS, getCategoryGroups } from '../config/categories';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ShopPage = () => {
  const { t } = useTranslation();
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

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [priceRange, setPriceRange] = useState({
    min: PRICE_LIMITS.min,
    max: PRICE_LIMITS.max,
  });
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Get category groups (memoized to prevent re-renders)
  const categoryGroups = React.useMemo(() => getCategoryGroups(), []);

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchQuery, selectedCategory, priceRange.min, priceRange.max]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: pagination.page,
          limit: 12, // Always limit to 12 products per page
        };
        
        if (searchQuery) params.q = searchQuery;
        if (selectedCategory !== 'all') {
          // Check if it's a group or individual category
          const group = categoryGroups.find(g => g.id === selectedCategory);
          if (group) {
            params.categoryGroup = selectedCategory;
          } else {
            params.category = selectedCategory;
          }
        }
        if (priceRange.min > PRICE_LIMITS.min) params.minPrice = priceRange.min;
        if (priceRange.max < PRICE_LIMITS.max) params.maxPrice = priceRange.max;
        
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
  }, [pagination.page, searchQuery, selectedCategory, priceRange.min, priceRange.max, categoryGroups, t]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by useEffect
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

  return (
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
                  <div className="nice-select" tabIndex="0">
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="form-select"
                    >
                      <option value="default">{t('shop.sortBy.default')}</option>
                      <option value="popularity">{t('shop.sortBy.popularity')}</option>
                      <option value="rating">{t('shop.sortBy.rating')}</option>
                      <option value="latest">{t('shop.sortBy.latest')}</option>
                      <option value="price-low">{t('shop.sortBy.priceLow')}</option>
                      <option value="price-high">{t('shop.sortBy.priceHigh')}</option>
                    </select>
                  </div>
                  <div className="icon">
                    <Link 
                      to="/shop-list" 
                      className={viewMode === 'list' ? 'active' : ''}
                      onClick={() => setViewMode('list')}
                    >
                      <i className="fas fa-list"></i>
                    </Link>
                  </div>
                  <div className={`icon-2 ${viewMode === 'grid' ? 'active' : ''}`}>
                    <Link 
                      to="/shop" 
                      onClick={() => setViewMode('grid')}
                    >
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
                    <div className={`row ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                      {products.map((product) => (
                        <div key={product._id} className="col-xl-4 col-lg-6 col-md-6">
                          <ProductCard product={product} />
                        </div>
                      ))}
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
  );
};

export default ShopPage;
