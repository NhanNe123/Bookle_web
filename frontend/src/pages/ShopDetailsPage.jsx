import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { getProductById, getRelatedProducts, reviewsAPI } from '../lib/api';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { formatCategoryName, encodeImageUrl, PRODUCT_IMAGE_FALLBACK } from '../utils/categoryUtils';
import { recordRecentlyViewedProductId } from '../utils/recentlyViewed';
import LoadingSpinner from '../components/common/LoadingSpinner';

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const ShopDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [language, setLanguage] = useState(i18n.language);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const fallbackRelatedProducts = [
    {
      _id: 'fallback-1',
      name: 'Castle The Sky',
      author: 'John Smith',
      price: 160000,
      compareAtPrice: 200000,
      images: [PRODUCT_IMAGE_FALLBACK],
      rating: 4,
      categories: ['Phiêu lưu'],
      stock: 8,
      isAvailable: true,
    },
    {
      _id: 'fallback-2',
      name: 'Mystery of the Lost City',
      author: 'David Chen',
      price: 195000,
      compareAtPrice: 245000,
      images: [PRODUCT_IMAGE_FALLBACK],
      rating: 5,
      categories: ['Bí ẩn'],
      stock: 5,
      isAvailable: true,
    },
    {
      _id: 'fallback-3',
      name: 'Science Fiction Dreams',
      author: 'Emma Wilson',
      price: 215000,
      compareAtPrice: 265000,
      images: [PRODUCT_IMAGE_FALLBACK],
      rating: 4,
      categories: ['Khoa học viễn tưởng'],
      stock: 9,
      isAvailable: true,
    },
  ];

  // Format price to VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch product details
        const productData = await getProductById(id);
        setProduct(productData);
        if (productData?._id) {
          recordRecentlyViewedProductId(productData._id);
        }

        // Fetch related products using AI-powered recommendation API
        try {
          const relatedData = await getRelatedProducts(id, 4);
          if (relatedData.success && relatedData.items) {
            setRelatedProducts(relatedData.items);
          }
        } catch (relatedErr) {
          console.error('Error fetching related products:', relatedErr);
          // Fallback to empty array if API fails
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(t('shop.details.error'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id, t]);

  // Fetch reviews when product is loaded
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      
      try {
        setReviewsLoading(true);
        const response = await reviewsAPI.getReviews(id);
        if (response.success) {
          setReviews(response.reviews || []);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  const handleQuantityChange = (type) => {
    const maxQty = product?.stock != null ? Number(product.stock) : 10;
    if (type === 'increase' && quantity < maxQty) {
      setQuantity(quantity + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    const stock = product?.stock != null ? Number(product.stock) : 0;
    if (product && product.isAvailable && stock > 0) {
      addToCart(product, quantity);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product);
    }
  };

  /** Mở chat Bookle (Header) với ngữ cảnh đúng cuốn sách đang xem — server nạp mô tả đầy đủ cho Qwen2.5 */
  const handleAskAIAboutBook = () => {
    if (!product?._id || !product?.name) return;
    window.dispatchEvent(
      new CustomEvent('bookle:open-ai-chat', {
        detail: { contextProductId: String(product._id), productName: product.name },
      })
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setReviewError(t('shop.details.reviews.errors.loginRequired'));
      return;
    }

    if (reviewRating === 0) {
      setReviewError(t('shop.details.reviews.errors.ratingRequired'));
      return;
    }

    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setReviewError(t('shop.details.reviews.errors.commentMinLength'));
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      const response = await reviewsAPI.createReview(id, reviewRating, reviewComment);
      
      if (response.success) {
        setReviewSuccess(true);
        setReviewComment('');
        setReviewRating(0);
        setReviewHoverRating(0);
        
        // Refresh reviews list
        const reviewsResponse = await reviewsAPI.getReviews(id);
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.reviews || []);
        }

        // Update product rating
        const productData = await getProductById(id);
        setProduct(productData);

        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err) {
      setReviewError(err.response?.data?.error || err.message || t('shop.details.reviews.errors.submitFailed'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return '/assets/img/icon/icon-9.svg';
    if (avatar.startsWith('http')) return avatar;
    return avatar;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner fullScreen={true} size="large" variant="spinner" text={t('shop.details.loading')} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error || t('shop.details.notFound')}
        </div>
        <Link to="/shop" className="theme-btn">
          {t('shop.details.backToShop')}
        </Link>
      </div>
    );
  }

  // Prepare product data with fallbacks
  const productImages = product.images && product.images.length > 0
    ? product.images.map((img) => encodeImageUrl(img))
    : [PRODUCT_IMAGE_FALLBACK];
  
  const productName = product.name || t('shop.details.title');
  const productPrice = product.price || 0;
  const comparePrice = product.compareAtPrice;
  const discount = comparePrice ? Math.round(((comparePrice - productPrice) / comparePrice) * 100) : 0;
  const productStock = product.stock != null ? Number(product.stock) : 0;
  const productAvailability = product.isAvailable && productStock > 0;
  const ratingValue = Number(product.rating) || 0;
  const ratingCount = product.ratingCount ?? product.reviews ?? 0;
  const displayedRelatedProducts = relatedProducts.length > 0 ? relatedProducts : fallbackRelatedProducts;
  const shortDescription = product.shortDescription || product.description || '';
  const longDescription = product.description || '';
  const metadataEntries = [
    [t('shop.details.additionalInfo.labels.sku'), product.sku || product._id],
    [t('shop.details.additionalInfo.labels.category'), product.categories && product.categories.length > 0 ? product.categories.map(cat => formatCategoryName(cat)).join(', ') : null],
    [t('shop.details.additionalInfo.labels.tags'), product.tags && product.tags.length > 0 ? product.tags.join(', ') : null],
    [t('shop.details.additionalInfo.labels.format'), product.format || product.binding || null],
    [t('shop.details.additionalInfo.labels.totalPage'), product.pages || product.pageCount || null],
    [t('shop.details.additionalInfo.labels.language'), product.language || null],
    [t('shop.details.additionalInfo.labels.publishYears'),
      product.publishYear || (product.publishedAt ? new Date(product.publishedAt).getFullYear() : null)
    ],
    [t('shop.details.additionalInfo.labels.country'), product.country || product.origin || null],
  ].filter(([, value]) => value);
  const groupedMetadata = chunkArray(metadataEntries, 2);
  const additionalInfo = [
    [t('shop.details.additionalInfo.labels.availability'), productAvailability ? t('shop.details.inStock', { count: productStock || 0 }) : t('shop.details.outOfStock')],
    [t('shop.details.additionalInfo.labels.categories'), product.categories && product.categories.length > 0 ? product.categories.map(cat => formatCategoryName(cat)).join(', ') : null],
    [t('shop.details.additionalInfo.labels.publishDate'), product.publishedAt ? new Date(product.publishedAt).toISOString().slice(0, 10) : null],
    [t('shop.details.additionalInfo.labels.totalPage'), product.pages || product.pageCount || null],
    [t('shop.details.additionalInfo.labels.format'), product.format || product.binding || null],
    [t('shop.details.additionalInfo.labels.country'), product.country || product.origin || null],
    [t('shop.details.additionalInfo.labels.language'), product.language || null],
    [t('shop.details.additionalInfo.labels.dimensions'), product.dimensions || product.size || null],
    [t('shop.details.additionalInfo.labels.weight'), product.weight ? `${product.weight}` : null],
  ].filter(([, value]) => value);

  return (
    <>
      {/* Breadcrumb Section */}
      <div className="breadcrumb-wrapper">
        <div className="container">
          <div className="page-heading">
            <h1>{t('shop.details.title')}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{t('header.menu.home')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{t('shop.details.breadcrumb')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Details Section */}
      <section className="shop-details-section fix section-padding">
        <div className="container">
          <div className="shop-details-wrapper">
            <div className="row g-4">
              <div className="col-lg-5">
                <div className="shop-details-image">
                  <div className="tab-content">
                    {productImages.map((image, index) => (
                      <div
                        key={index}
                        id={`thumb${index + 1}`}
                        className={`tab-pane fade ${activeImage === index ? 'show active' : ''}`}
                      >
                        <div className="shop-details-thumb">
                          <div className="shop-details-cover-frame">
                            <img
                              className="book-cover-img"
                              src={image}
                              alt={`${productName} ${index + 1}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ul className="nav">
                    {productImages.map((image, index) => (
                      <li key={index} className="nav-item">
                        <a
                          href={`#thumb${index + 1}`}
                          className={`nav-link ${activeImage === index ? 'active' : ''}`}
                          data-bs-toggle="tab"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveImage(index);
                          }}
                        >
                          <img
                            className="shop-details-nav-thumb-img"
                            src={image}
                            alt={`${productName} thumbnail ${index + 1}`}
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-lg-7">
                <div className="shop-details-content" key={`product-details-${i18n.language}`}>
                  <div className="title-wrapper">
                    <h2>{productName}</h2>
                    <h5>{productAvailability ? t('shop.details.inStock', { count: productStock || 0 }) : t('shop.details.outOfStock')}</h5>
                  </div>
                  <div className="star">
                    {[...Array(5)].map((_, index) => (
                      <a key={index} href="#review">
                        <i className={index < Math.round(ratingValue) ? 'fas fa-star' : 'fa-regular fa-star'}></i>
                      </a>
                    ))}
                    <span>{t('shop.details.customerReviews', { count: ratingCount })}</span>
                  </div>
                  <p>{shortDescription}</p>
                  <div className="d-flex align-items-center flex-wrap" style={{ gap: '20px', marginBottom: '20px' }}>
                    <div className="price-list">
                      <h3>{formatPrice(productPrice)}</h3>
                      {comparePrice && <del>{formatPrice(comparePrice)}</del>}
                    </div>
                    {/* Thông báo cart status - nằm ngang hàng với giá */}
                    {isInCart(product._id) && (
                      <div className="text-muted small">
                        <i className="fa-solid fa-circle-info me-2"></i>
                        <span>{t('shop.details.inCart', { count: getItemQuantity(product._id) })}</span>
                      </div>
                    )}
                  </div>
                  <div className="cart-wrapper position-relative">
                    <div className="quantity-basket">
                      <p className="qty">
                        <button
                          className="qtyminus"
                          onClick={() => handleQuantityChange('decrease')}
                          aria-hidden="true"
                          disabled={!productAvailability}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          name="qty"
                          id="qty2"
                          min="1"
                          max={productStock || 10}
                          step="1"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            const maxQty = productStock || 10;
                            setQuantity(Math.max(1, Math.min(val, maxQty)));
                          }}
                          disabled={!productAvailability}
                        />
                        <button
                          className="qtyplus"
                          onClick={() => handleQuantityChange('increase')}
                          aria-hidden="true"
                          disabled={!productAvailability}
                        >
                          +
                        </button>
                      </p>
                    </div>
                    <div className="d-flex flex-column gap-2 align-items-stretch">
                      <button
                        type="button"
                        className="theme-btn style-2"
                        onClick={() => setShowReadMoreModal(true)}
                      >
                        {t('shop.details.readALittle')}
                      </button>
                      <button
                        type="button"
                        className="theme-btn bookle-ai-btn"
                        onClick={handleAskAIAboutBook}
                        title={t('shop.details.askAIAboutBook')}
                      >
                        <i className="fa-solid fa-robot me-2" aria-hidden="true" />
                        {t('shop.details.askAIAboutBook')}
                      </button>
                    </div>
                    <div className="position-relative" style={{ display: 'inline-block' }}>
                    
                      {showNotification && (
                        <div 
                          className="position-fixed top-0 end-0 p-3" 
                          style={{ zIndex: 1100, whiteSpace: 'nowrap' }}
                        >
                          <div className="alert alert-success py-2 px-3 mb-0 shadow-lg">
                            {t('shop.details.addToCartSuccess', { quantity })}
                          </div>
                        </div>
                      )}
                      {/* // --- THAY ĐỔI KẾT THÚC --- */}

                      <button
                        className="theme-btn"
                        onClick={handleAddToCart}
                        disabled={!productAvailability}
                      >
                        <i className="fa-solid fa-basket-shopping"></i>
                        {productAvailability ? ` ${t('shop.details.addToCart')}` : ` ${t('shop.details.outOfStock')}`}
                      </button>
                    </div>
                    <div className="icon-box">
                      <a
                        href="#"
                        className={`icon ${isInWishlist(product._id) ? 'text-danger' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleWishlist();
                        }}
                        title={isInWishlist(product._id) ? t('shop.details.removeFromWishlist') : t('shop.details.addToWishlist')}
                      >
                        <i className={isInWishlist(product._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                      </a>
                      <a
                        href="#"
                        className="icon-2"
                        onClick={(e) => {
                          e.preventDefault();
                          // Compare functionality placeholder
                        }}
                        title={t('shop.details.compare')}
                      >
                        <img src="/assets/img/icon/shuffle.svg" alt="svg-icon" />
                      </a>
                    </div>
                  </div>
                  <div className="category-box">
                    <div className="category-list">
                      {groupedMetadata.length > 0 ? (
                        groupedMetadata.map((group, index) => (
                          <ul key={index}>
                            {group.map(([label, value]) => (
                              <li key={label}>
                                <span>{label}:</span> {value}
                              </li>
                            ))}
                          </ul>
                        ))
                      ) : (
                        <ul>
                          <li>{t('shop.details.updatingInfo')}</li>
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="box-check" key={`features-${i18n.language}`}>
                    <div className="check-list">
                      <ul>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          {t('shop.details.features.freeShipping')}
                        </li>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          {t('shop.details.features.returnPolicy')}
                        </li>
                      </ul>
                      <ul>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          {t('shop.details.features.authentic')}
                        </li>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          {t('shop.details.features.secure')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="single-tab section-padding pb-0">
              <ul className="nav mb-5" role="tablist">
                <li className="nav-item" role="presentation">
                  <a
                    href="#description"
                    className={`nav-link ps-0 ${activeTab === 'description' ? 'active' : ''}`}
                    role="tab"
                    data-bs-toggle="tab"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('description');
                    }}
                  >
                    <h6>{t('shop.details.tabs.description')}</h6>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a
                    href="#additional"
                    className={`nav-link ${activeTab === 'additional' ? 'active' : ''}`}
                    role="tab"
                    data-bs-toggle="tab"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('additional');
                    }}
                  >
                    <h6>{t('shop.details.tabs.additional')}</h6>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a
                    href="#review"
                    className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                    role="tab"
                    data-bs-toggle="tab"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('reviews');
                    }}
                  >
                    <h6>{t('shop.details.tabs.reviews')} ({ratingCount})</h6>
                  </a>
                </li>
              </ul>
              <div className="tab-content">
                <div id="description" className={`tab-pane fade ${activeTab === 'description' ? 'show active' : ''}`}>
                  <div className="tab-content-wrapper">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{longDescription}</p>
                  </div>
                </div>
                <div id="additional" className={`tab-pane fade ${activeTab === 'additional' ? 'show active' : ''}`}>
                  <div className="tab-content-wrapper">
                    {additionalInfo.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <tbody>
                            {additionalInfo.map(([label, value]) => (
                              <tr key={label}>
                                <td className="text-1">{label}</td>
                                <td className="text-2">{value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>{t('shop.details.additionalInfo.updating')}</p>
                    )}
                  </div>
                </div>
                <div id="review" className={`tab-pane fade ${activeTab === 'reviews' ? 'show active' : ''}`}>
                  <div className="tab-content-wrapper">
                    {/* Reviews List */}
                    <div className="review-items mb-5">
                      {reviewsLoading ? (
                        <div className="text-center py-4">
                          <LoadingSpinner size="medium" variant="dots" text={t('shop.details.reviews.loading')} />
                        </div>
                      ) : reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review._id} className="review-wrap-area d-flex gap-4 flex-wrap mb-4 pb-4 border-bottom">
                            <div className="review-thumb">
                              <img 
                                src={getAvatarUrl(review.avatar)} 
                                alt={review.name}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                            <div className="review-content flex-grow-1">
                              <div className="head-area d-flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
                                <div className="cont">
                                  <h5 className="mb-1">{review.name}</h5>
                                  <span className="text-muted small">{formatDate(review.createdAt)}</span>
                                  {review.isEdited && (
                                    <span className="text-muted small ms-2">{t('shop.details.reviews.edited')}</span>
                                  )}
                                </div>
                                <div className="star">
                                  {[...Array(5)].map((_, index) => (
                                    <i 
                                      key={index} 
                                      className={index < review.rating ? 'fa-solid fa-star text-warning' : 'fa-regular fa-star'}
                                    ></i>
                                  ))}
                                </div>
                              </div>
                              <p className="mt-3 mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="review-wrap-area d-flex gap-4 flex-wrap">
                          <div className="review-thumb">
                            <img src="/assets/img/shop-details/review.png" alt="review" />
                          </div>
                          <div className="review-content">
                            <div className="head-area d-flex flex-wrap gap-2 align-items-center justify-content-between">
                              <div className="cont">
                                <h5>{t('shop.details.reviews.noReviews')}</h5>
                                <span>{t('shop.details.reviews.noReviewsMessage')}</span>
                              </div>
                            </div>
                            <p className="mt-4 mb-4">
                              {t('shop.details.reviews.noReviewsDescription')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Review Form - Only for authenticated users */}
                    {isAuthenticated ? (
                      <>
                        <div className="review-title mt-5 py-3 mb-4">
                          <h4>{t('shop.details.reviews.yourReview')}</h4>
                          <div className="rate-now d-flex align-items-center">
                            <p className="mb-0 me-3">{t('shop.details.reviews.rating')}</p>
                            <div className="star" style={{ cursor: 'pointer' }}>
                              {[...Array(5)].map((_, index) => {
                                const starValue = index + 1;
                                const isActive = starValue <= (reviewHoverRating || reviewRating);
                                return (
                                  <i
                                    key={index}
                                    className={isActive ? 'fa-solid fa-star text-warning' : 'fa-regular fa-star'}
                                    style={{ fontSize: '20px', marginRight: '5px' }}
                                    onMouseEnter={() => setReviewHoverRating(starValue)}
                                    onMouseLeave={() => setReviewHoverRating(0)}
                                    onClick={() => setReviewRating(starValue)}
                                  ></i>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="review-form">
                          <form onSubmit={handleSubmitReview}>
                            <div className="row g-4">
                              <div className="col-lg-12">
                                <div className="form-clt">
                                  <span>{t('shop.details.reviews.comment')}</span>
                                  <textarea 
                                    name="comment" 
                                    placeholder={t('shop.details.reviews.commentPlaceholder')}
                                    value={reviewComment}
                                    onChange={(e) => {
                                      setReviewComment(e.target.value);
                                      setReviewError(null);
                                    }}
                                    rows="5"
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                  ></textarea>
                                </div>
                              </div>
                              <div className="col-lg-12">
                                {reviewError && (
                                  <div className="alert alert-danger mb-3" role="alert">
                                    {reviewError}
                                  </div>
                                )}
                                {reviewSuccess && (
                                  <div className="alert alert-success mb-3" role="alert">
                                    {t('shop.details.reviews.success')}
                                  </div>
                                )}
                                <button 
                                  type="submit" 
                                  className="theme-btn mt-3"
                                  disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                                >
                                  {isSubmittingReview ? (
                                    <>
                                      <LoadingSpinner size="small" variant="dots" className="me-2" />
                                      {t('shop.details.reviews.submitting')}
                                    </>
                                  ) : (
                                    t('shop.details.reviews.submit')
                                  )}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-info mt-5">
                        <i className="fa-solid fa-info-circle me-2"></i>
                        {t('shop.details.reviews.loginPrompt')} <Link to="/" onClick={(e) => {
                          e.preventDefault();
                          // Trigger login modal - you might need to pass this through props
                          window.location.href = '/?login=true';
                        }}>{t('shop.details.reviews.loginLink')}</Link> {t('shop.details.reviews.loginMessage')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {displayedRelatedProducts.length > 0 && (
        <section className="top-ratting-book-section fix section-padding pt-0">
          <div className="container">
            <div className="section-title text-center">
              <h2 className="mb-3">{t('shop.details.relatedProducts.title')}</h2>
              <p>{t('shop.details.relatedProducts.description')}</p>
            </div>
            <div className="row g-4 justify-content-center">
              {displayedRelatedProducts.map((relatedProduct) => (
                <div key={relatedProduct._id || relatedProduct.id} className="col-xl-3 col-lg-4 col-md-6">
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Read More Modal */}
      {showReadMoreModal && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body" style={{ backgroundImage: 'url(/assets/img/popupBg.png)' }}>
                <div className="close-btn">
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowReadMoreModal(false)}
                  ></button>
                </div>
                <div className="readMoreBox">
                  <div className="content">
                    <h3>{productName}</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                      {product.description || product.shortDescription || t('shop.details.readMore.noContent')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showReadMoreModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default ShopDetailsPage;