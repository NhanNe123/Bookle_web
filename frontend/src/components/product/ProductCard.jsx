import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { formatCategoryName } from '../../utils/categoryUtils';

const ProductCard = ({ product }) => {
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
    rating = 0, 
    isHot, 
    categories = [],
    stock = 0,
    isAvailable = true
  } = product;
  
  const image = images[0] || '/assets/img/book/01.png';
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
        <Link to={productUrl}>
          <img src={image} alt={name} />
        </Link>
        {(isHot || discount > 0) && (
          <ul className="post-box">
            {isHot && <li>Hot</li>}
            {discount > 0 && <li>-{discount}%</li>}
          </ul>
        )}
        {!isAvailable && (
          <div className="out-of-stock-badge">Hết hàng</div>
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
              title={isInWishlist(_id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
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
            {isInWishlist(_id) ? '💙 Đã thêm vào yêu thích' : '💔 Đã xóa khỏi yêu thích'}
          </div>
        )}
      </div>
      <div className="shop-content">
        <h5>
          <Link to={productUrl}>{name}</Link>
        </h5>
        {categoryDisplay && (
          <h3>
            <Link to="/shop">{categoryDisplay}</Link>
          </h3>
        )}
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
              <span className="text">Tác giả:</span>
              <span className="author">{author}</span>
            </li>
            <li className="star">
              {[...Array(5)].map((_, index) => (
                <i 
                  key={index} 
                  className={index < Math.floor(rating) ? "fa-solid fa-star" : "fa-regular fa-star"}
                ></i>
              ))}
            </li>
          </ul>
        )}
      </div>
      <div className="shop-button">
        <button 
          className="theme-btn" 
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
          {!isAvailable || stock <= 0 ? 'Hết hàng' : isInCart(_id) ? 'Thêm nữa' : 'Thêm vào giỏ'}
        </button>
        {showNotification && (
          <div 
            className="position-absolute top-0 start-50 translate-middle-x mt-n3 alert alert-success py-2 px-3" 
            style={{ zIndex: 1050, fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          >
            Đã thêm vào giỏ hàng!
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
