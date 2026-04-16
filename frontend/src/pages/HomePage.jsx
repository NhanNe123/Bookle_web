import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroSection from '../components/home/HeroSection';
import ProductList from '../components/product/ProductList';
import { getProducts, getProductById } from '../lib/api';
import {
  getRecentlyViewedProductIds,
  RECENTLY_VIEWED_CHANGED_EVENT,
} from '../utils/recentlyViewed';

const HOME_RECENTLY_VIEWED_PREVIEW = 8;
const HOME_RECENTLY_VIEWED_EXPANDED = 16;

function uniqueRecentProductIds() {
  return [...new Set(getRecentlyViewedProductIds())];
}

const HomePage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [newProducts, setNewProducts] = useState([]);
  const [bookShelves, setBookShelves] = useState({
    manga: [],
    investing: [],
    textbook: [],
  });
  const [shelvesLoading, setShelvesLoading] = useState(true);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [recentlyViewedLoading, setRecentlyViewedLoading] = useState(false);
  const [recentlyViewedExpanded, setRecentlyViewedExpanded] = useState(false);
  const [recentlyViewedRefresh, setRecentlyViewedRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const featuredCategories = [
    {
      key: 'manga',
      slug: 'truyen-tranh',
      icon: 'fa-book-open-reader',
      title: t('home.featuredCategories.manga.title'),
      subtitle: t('home.featuredCategories.manga.subtitle'),
    },
    {
      key: 'investing',
      slug: 'dau-tu-tai-chinh',
      icon: 'fa-chart-line',
      title: t('home.featuredCategories.investing.title'),
      subtitle: t('home.featuredCategories.investing.subtitle'),
    },
    {
      key: 'textbook',
      slug: 'giao-trinh',
      icon: 'fa-graduation-cap',
      title: t('home.featuredCategories.textbook.title'),
      subtitle: t('home.featuredCategories.textbook.subtitle'),
    },
    {
      key: 'ai',
      slug: 'ai-machine-learning',
      icon: 'fa-robot',
      title: t('home.featuredCategories.ai.title'),
      subtitle: t('home.featuredCategories.ai.subtitle'),
    },
  ];

  // Check for OAuth errors, verification, or success in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const loginParam = searchParams.get('login');
    const verifiedParam = searchParams.get('verified');
    
    if (errorParam === 'google_not_configured') {
      setNotification({ type: 'warning', message: 'Google OAuth chưa được cấu hình. Vui lòng sử dụng email/password để đăng nhập.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (errorParam === 'facebook_not_configured') {
      setNotification({ type: 'warning', message: 'Facebook OAuth chưa được cấu hình. Vui lòng sử dụng email/password để đăng nhập.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (errorParam === 'invalid_or_expired_token') {
      setNotification({ type: 'danger', message: 'Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (errorParam === 'verification_failed') {
      setNotification({ type: 'danger', message: 'Xác thực email thất bại. Vui lòng thử lại.' });
      searchParams.delete('error');
      setSearchParams(searchParams);
    } else if (verifiedParam === 'success') {
      setNotification({ type: 'success', message: '✅ Email đã được xác thực thành công! Chào mừng bạn đến với Bookle.' });
      searchParams.delete('verified');
      setSearchParams(searchParams);
    } else if (loginParam === 'success') {
      setNotification({ type: 'success', message: 'Đăng nhập thành công! Chào mừng bạn đến với Bookle.' });
      searchParams.delete('login');
      setSearchParams(searchParams);
    } else if (loginParam === 'failed') {
      setNotification({ type: 'danger', message: 'Đăng nhập thất bại. Vui lòng thử lại.' });
      searchParams.delete('login');
      setSearchParams(searchParams);
    }
    
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts({ limit: 8, sortBy: 'latest' });
        setNewProducts(data.items || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchShelves = async () => {
      try {
        setShelvesLoading(true);
        const [mangaData, investingData, textbookData] = await Promise.all([
          getProducts({ category: 'truyen-tranh', limit: 10, sortBy: 'random' }),
          getProducts({ category: 'dau-tu-tai-chinh', limit: 10, sortBy: 'random' }),
          getProducts({ category: 'giao-trinh', limit: 10, sortBy: 'random' }),
        ]);

        setBookShelves({
          manga: mangaData.items || [],
          investing: investingData.items || [],
          textbook: textbookData.items || [],
        });
      } catch (err) {
        console.error('Error fetching shelves:', err);
      } finally {
        setShelvesLoading(false);
      }
    };

    fetchShelves();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const bump = () => setRecentlyViewedRefresh((n) => n + 1);
    window.addEventListener(RECENTLY_VIEWED_CHANGED_EVENT, bump);
    return () => window.removeEventListener(RECENTLY_VIEWED_CHANGED_EVENT, bump);
  }, []);

  useEffect(() => {
    const allIds = uniqueRecentProductIds();
    const limit = recentlyViewedExpanded
      ? HOME_RECENTLY_VIEWED_EXPANDED
      : HOME_RECENTLY_VIEWED_PREVIEW;
    const ids = allIds.slice(0, limit);
    if (ids.length === 0) {
      setRecentlyViewedProducts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setRecentlyViewedLoading(true);
      try {
        const results = await Promise.all(
          ids.map((productId) => getProductById(productId).catch(() => null))
        );
        if (cancelled) return;
        const ordered = ids
          .map((id, i) => ({ id, doc: results[i] }))
          .filter((x) => x.doc && x.doc._id)
          .map((x) => x.doc);
        setRecentlyViewedProducts(ordered);
      } finally {
        if (!cancelled) setRecentlyViewedLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recentlyViewedExpanded, recentlyViewedRefresh]);

  const recentlyViewedUniqueCount = uniqueRecentProductIds().length;
  const showRecentlyViewedMore =
    recentlyViewedUniqueCount > HOME_RECENTLY_VIEWED_PREVIEW &&
    !recentlyViewedExpanded;
  const showRecentlyViewedShopHint =
    recentlyViewedExpanded &&
    recentlyViewedUniqueCount > HOME_RECENTLY_VIEWED_EXPANDED;

  const showRecentlyViewed =
    recentlyViewedLoading || recentlyViewedProducts.length > 0;

  return (
    <div className="home-page">
      {/* Notification */}
      {notification && (
        <div 
          className={`alert alert-${notification.type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`}
          style={{ zIndex: 9999, maxWidth: '500px' }}
          role="alert"
        >
          {notification.message}
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}
      
      {/* Hero Section */}
      <HeroSection />

      {/* Feature Section */}
      <section className="feature-section fix section-padding">
        <div className="container">
          <div className="feature-wrapper">
            <div className="row g-4">
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".3s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-truck-fast"></i>
                  </div>
                  <div className="content">
                    <h4>Miễn phí vận chuyển</h4>
                    <p>Đơn hàng từ 200.000đ</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".5s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-credit-card"></i>
                  </div>
                  <div className="content">
                    <h4>Thanh toán an toàn</h4>
                    <p>100% bảo mật</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".7s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-shield-check"></i>
                  </div>
                  <div className="content">
                    <h4>Chính hãng 100%</h4>
                    <p>Cam kết chất lượng</p>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay=".9s">
                <div className="feature-items text-center">
                  <div className="icon">
                    <i className="fa-solid fa-headset"></i>
                  </div>
                  <div className="content">
                    <h4>Hỗ trợ 24/7</h4>
                    <p>Luôn sẵn sàng phục vụ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Categories */}
      <section className="book-category-section section-padding fix pt-0">
        <div className="container">
          <div className="section-title text-center">
            <h2 className="mb-2 wow fadeInUp" data-wow-delay=".3s">
              {t('home.featuredCategories.title')}
            </h2>
            <p className="text-muted mb-0 wow fadeInUp" data-wow-delay=".35s">
              {t('home.featuredCategories.subtitle')}
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {featuredCategories.map((category, index) => (
              <div key={category.key} className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={`.${index + 3}s`}>
                <Link to={`/shop?category=${category.slug}`} className="category-card text-center">
                  <div className="category-icon">
                    <i className={`fa-solid ${category.icon}`}></i>
                  </div>
                  <h5 className="mt-3 mb-1">{category.title}</h5>
                  <p className="mb-0 text-muted small">{category.subtitle}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Themed Shelves */}
      <section className="shop-section section-padding fix pt-0">
        <div className="container">
          {[
            { key: 'manga', title: t('home.shelves.manga.title'), subtitle: t('home.shelves.manga.subtitle'), slug: 'truyen-tranh' },
            { key: 'investing', title: t('home.shelves.investing.title'), subtitle: t('home.shelves.investing.subtitle'), slug: 'dau-tu-tai-chinh' },
            { key: 'textbook', title: t('home.shelves.textbook.title'), subtitle: t('home.shelves.textbook.subtitle'), slug: 'giao-trinh' },
          ].map((shelf, shelfIndex) => (
            <div key={shelf.key} className="home-shelf-block wow fadeInUp" data-wow-delay={`.${shelfIndex + 3}s`}>
              <div className="d-flex align-items-end justify-content-between gap-3 mb-3">
                <div>
                  <h3 className="mb-1">{shelf.title}</h3>
                  <p className="text-muted mb-0">{shelf.subtitle}</p>
                </div>
                <Link to={`/shop?category=${shelf.slug}`} className="home-shelf-more">
                  {t('home.shelves.viewMore')} <i className="fa-solid fa-arrow-right-long"></i>
                </Link>
              </div>
              <div className="home-shelf-carousel">
                <ProductList
                  products={bookShelves[shelf.key]}
                  loading={shelvesLoading}
                  error={null}
                  columns={4}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {showRecentlyViewed && (
        <section className="shop-section section-padding fix pt-0">
          <div className="container">
            <div className="section-title text-center">
              <h2 className="mb-2 wow fadeInUp" data-wow-delay=".3s">
                {t('home.recentlyViewed.title')}
              </h2>
              <p className="text-muted mb-0 wow fadeInUp" data-wow-delay=".35s">
                {t('home.recentlyViewed.subtitle')}
              </p>
            </div>
            <div className="home-shelf-carousel home-recently-viewed-strip">
              <ProductList
                products={recentlyViewedProducts}
                loading={recentlyViewedLoading}
                error={null}
                columns={4}
              />
            </div>
            {!recentlyViewedLoading &&
              showRecentlyViewedMore &&
              recentlyViewedProducts.length > 0 && (
                <div className="text-center mt-4 wow fadeInUp" data-wow-delay=".4s">
                  <button
                    type="button"
                    className="theme-btn"
                    onClick={() => setRecentlyViewedExpanded(true)}
                  >
                    {t('home.recentlyViewed.viewMore')}{' '}
                    <i className="fa-solid fa-arrow-right-long" aria-hidden="true" />
                  </button>
                </div>
              )}
            {showRecentlyViewedShopHint && (
              <p className="text-center text-muted small mt-3 mb-0">
                <Link to="/shop" className="home-recently-viewed-shop-link">
                  {t('home.recentlyViewed.moreOnShop')}
                </Link>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Shop Section - New Products */}
      <section className="shop-section section-padding fix pt-0">
        <div className="container">
          <div className="section-title text-center">
            <h2 className="mb-3 wow fadeInUp" data-wow-delay=".3s">
              {t('home.new.title')}
            </h2>
            <p className="text-muted mb-0 wow fadeInUp" data-wow-delay=".35s">
              {t('home.new.subtitle')}
            </p>
          </div>
          <ProductList 
            products={newProducts} 
            loading={loading} 
            error={error}
            columns={4}
          />
          {!loading && newProducts.length > 0 && (
            <div className="text-center mt-5 wow fadeInUp" data-wow-delay=".4s">
              <Link to="/shop" className="theme-btn">
                Xem tất cả <i className="fa-solid fa-arrow-right-long"></i>
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Banner */}
      <section className="cta-banner-section section-padding pt-0">
        <div className="container">
          <div className="cta-banner-wrapper bg-cover" style={{backgroundImage: 'url(/assets/img/cta-banner.jpg)'}}>
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="cta-content">
                  <h2 className="wow fadeInUp" data-wow-delay=".3s">
                    Giảm giá <span className="text-warning">30%</span> 
                    <br />Tất cả sách trong tháng này
                  </h2>
                  <Link to="/shop" className="theme-btn mt-4 wow fadeInUp" data-wow-delay=".5s">
                    Mua ngay <i className="fa-solid fa-arrow-right-long"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;