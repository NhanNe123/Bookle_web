import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useTranslation } from 'react-i18next';
import { formatCategoryName, getProductImage } from '../../utils/categoryUtils';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [showNotification, setShowNotification] = useState(false);
  const [showWishlistNotification, setShowWishlistNotification] = useState(false);
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
    language = 'vi'
  } = product;
  
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
  
  const image = getProductImage(images, coverImage);
  const discount = compareAtPrice ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  const productUrl = `/shop-details/${slug || _id}`;
  const categoryDisplay = categories.length > 0 ? formatCategoryName(categories[0]) : '';
  
  // Format price to VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="shop-box-items style-2">
      <div className="book-thumb center">
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
          <div className="out-of-stock-badge">{t('shop.outOfStock')}</div>
        )}
        <ul className="shop-icon d-grid justify-content-center align-items-center">
          <li>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product);
                setShowWishlistNotification(true);
                setTimeout(() => setShowWishlistNotification(false), 2000);
              }}
              className={isInWishlist(_id) ? 'text-danger' : ''}
              title={isInWishlist(_id) ? t('shop.removeFromWishlist') : t('shop.addToWishlist')}
            >
              <i className={isInWishlist(_id) ? "fas fa-heart" : "far fa-heart"}></i>
            </a>
          </li>
          <li>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              // Compare functionality
            }}>
              <img className="icon" src="/assets/img/icon/shuffle.svg" alt="svg-icon" />
            </a>
          </li>
          <li>
            <Link to={productUrl}>
              <i className="far fa-eye"></i>
            </Link>
          </li>
        </ul>
        {showWishlistNotification && (
          <div 
            className="position-absolute top-0 start-50 translate-middle-x mt-n3 alert alert-info py-1 px-2" 
            style={{ zIndex: 1050, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            {isInWishlist(_id) ? `💙 ${t('shop.addToWishlist')}` : `💔 ${t('shop.removeFromWishlist')}`}
          </div>
        )}
      </div>
      <div className="shop-content">
        <h4 className="book-title product-card-title">
          <Link to={productUrl} className="product-card-title-link">{name}</Link>
        </h4>
        {categoryDisplay && (
          <p className="book-category product-card-category">
            <Link to="/shop" className="product-card-category-link">{categoryDisplay}</Link>
          </p>
        )}
        {author && <p className="product-card-author">{author}</p>}
        <ul className="price-list">
          {compareAtPrice && (
            <li>
              <del>{formatPrice(compareAtPrice)}</del>
            </li>
          )}
          <li>{formatPrice(price)}</li>
        </ul>
        <div className="product-card-rating" aria-label={`${rating}/5`}>
          {[...Array(5)].map((_, index) => (
            <i
              key={index}
              className={index < Math.floor(rating) ? "fa-solid fa-star" : "fa-regular fa-star"}
            ></i>
          ))}
        </div>
      </div>
      <div className="shop-button">
        <button 
          className="theme-btn product-card-ghost-btn"
          onClick={(e) => {
            e.preventDefault();
            if (isAvailable && stock > 0) {
              addToCart(product, 1);
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 2000);
            }
          }}
          disabled={!isAvailable || stock <= 0}
        >
          <i className="fa-solid fa-basket-shopping"></i> 
          {!isAvailable || stock <= 0 ? t('shop.outOfStock') : isInCart(_id) ? t('shop.addMore') : t('shop.addToCart')}
        </button>
        {showNotification && (
          <div 
            className="position-absolute top-0 start-50 translate-middle-x mt-n3 alert alert-success py-2 px-3" 
            style={{ zIndex: 1050, fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            {t('shop.addedToCart')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
