import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useTranslation } from 'react-i18next';
import { getProductImage } from '../utils/categoryUtils';

const ShopCartPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleQuantityChange = (productId, newQuantity, maxStock) => {
    const qty = Math.max(1, Math.min(parseInt(newQuantity) || 1, maxStock || 999));
    updateQuantity(productId, qty);
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm(t('shop.cart.removeConfirm') || 'Bạn có chắc muốn xóa sản phẩm này?')) {
      removeFromCart(productId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm(t('shop.cart.clearConfirm') || 'Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <>
        {/* Breadcrumb */}
        <div className="breadcrumb-wrapper">
          <div className="book1">
            <img src="/assets/img/hero/book1.png" alt="book" />
          </div>
          <div className="book2">
            <img src="/assets/img/hero/book2.png" alt="book" />
          </div>
          <div className="container">
            <div className="page-heading">
              <h1>{t('shop.cart.title') || 'Giỏ hàng'}</h1>
              <div className="page-header">
                <ul className="breadcrumb-items">
                  <li><Link to="/">{t('common.home') || 'Trang chủ'}</Link></li>
                  <li><i className="fa-solid fa-chevron-right"></i></li>
                  <li>{t('shop.cart.title') || 'Giỏ hàng'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <section className="cart-section section-padding">
          <div className="container">
            <div className="text-center py-5">
              <i className="fa-solid fa-cart-shopping fa-4x text-muted mb-4"></i>
              <h3>{t('shop.cart.empty') || 'Giỏ hàng trống'}</h3>
              <p className="text-muted mb-4">{t('shop.cart.emptyDescription') || 'Bạn chưa có sản phẩm nào trong giỏ hàng'}</p>
              <Link to="/shop" className="theme-btn">
                <i className="fa-solid fa-arrow-left me-2"></i> {t('shop.cart.continueShopping') || 'Tiếp tục mua sắm'}
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const subtotal = getCartTotal();
  const shipping = subtotal >= 200000 ? 0 : 30000;
  const total = subtotal + shipping;

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-wrapper">
        <div className="book1">
          <img src="/assets/img/hero/book1.png" alt="book" />
        </div>
        <div className="book2">
          <img src="/assets/img/hero/book2.png" alt="book" />
        </div>
        <div className="container">
          <div className="page-heading">
            <h1>{t('shop.cart.title') || 'Giỏ hàng'}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items">
                <li><Link to="/">{t('common.home') || 'Trang chủ'}</Link></li>
                <li><i className="fa-solid fa-chevron-right"></i></li>
                <li>{t('shop.cart.title') || 'Giỏ hàng'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <section className="cart-section section-padding">
        <div className="container">
          <div className="main-cart-wrapper">
            <div className="row g-5">
              <div className="col-xl-8">
                <div className="table-responsive">
                  <table className="table cart-table">
                    <thead>
                      <tr>
                        <th className="cart-col cart-col--product">
                          {t('shop.cart.product') || 'Sản phẩm'}
                        </th>
                        <th className="cart-col cart-col--price text-end">
                          {t('shop.cart.price') || 'Giá'}
                        </th>
                        <th className="cart-col cart-col--qty text-center">
                          {t('shop.cart.quantity') || 'Số lượng'}
                        </th>
                        <th className="cart-col cart-col--line-total text-end">
                          {t('shop.cart.total') || 'Tổng'}
                        </th>
                        <th className="cart-col cart-col--remove text-center">
                          {t('shop.cart.remove') || 'Xóa'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item._id}>
                          <td className="cart-col cart-col--product">
                            <div className="cart-product-items d-flex align-items-center">
                              <div className="product-image">
                                <Link to={`/shop-details/${item.slug || item._id}`} className="d-inline-block">
                                  <div className="cart-thumb-frame">
                                    <img
                                      src={getProductImage(item.images, item.coverImage)}
                                      alt={item.name}
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  </div>
                                </Link>
                              </div>
                              <div className="product-content ms-3">
                                <h4>
                                  <Link to={`/shop-details/${item.slug || item._id}`}>
                                    {item.name}
                                  </Link>
                                </h4>
                                {item.author && (
                                  <p className="text-muted mb-0 small">{t('shop.author') || 'Tác giả:'} {item.author}</p>
                                )}
                                {item.stock <= 5 && item.stock > 0 && (
                                  <p className="text-warning mb-0 small">
                                    <i className="fa-solid fa-triangle-exclamation me-1"></i>
                                    Chỉ còn {item.stock} sản phẩm
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="cart-col cart-col--price text-end">
                            <div className="cart-price-cell">
                              <h6 className="mb-0">{formatPrice(item.price)}</h6>
                              {item.compareAtPrice && item.compareAtPrice > item.price && (
                                <del className="text-muted small d-block">
                                  {formatPrice(item.compareAtPrice)}
                                </del>
                              )}
                            </div>
                          </td>
                          <td className="cart-col cart-col--qty text-center">
                            <div className="cart-quantity-controls">
                              <button
                                type="button"
                                className="qty-btn minus"
                                onClick={() =>
                                  handleQuantityChange(
                                    item._id,
                                    Math.max(1, item.quantity - 1),
                                    item.stock
                                  )
                                }
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                                tabIndex={0}
                              >
                                <i className="fa-solid fa-minus" aria-hidden="true" />
                              </button>
                              <input
                                type="number"
                                className="qty-input"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  const maxQty = item.stock || 999;
                                  const newQty = Math.max(1, Math.min(val, maxQty));
                                  handleQuantityChange(item._id, newQty, item.stock);
                                }}
                                min="1"
                                max={item.stock || 999}
                                aria-label="Quantity"
                              />
                              <button
                                type="button"
                                className="qty-btn plus"
                                onClick={() =>
                                  handleQuantityChange(
                                    item._id,
                                    Math.min(item.quantity + 1, item.stock || 999),
                                    item.stock
                                  )
                                }
                                disabled={item.quantity >= (item.stock || 999)}
                                aria-label="Increase quantity"
                                tabIndex={0}
                              >
                                <i className="fa-solid fa-plus" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                          <td className="cart-col cart-col--line-total text-end">
                            <h6 className="mb-0 cart-line-total-price">
                              {formatPrice(item.price * item.quantity)}
                            </h6>
                          </td>
                          <td className="cart-col cart-col--remove text-center">
                            <button
                              type="button"
                              className="remove-icon"
                              onClick={() => handleRemoveItem(item._id)}
                              title={t('shop.cart.removeItem') || 'Xóa sản phẩm'}
                            >
                              <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cart Actions */}
                <div className="cart-wrapper-footer mt-4">
                  <form className="d-flex align-items-center" onSubmit={(e) => e.preventDefault()}>
                    <input 
                      type="text" 
                      placeholder={t('shop.cart.couponPlaceholder') || 'Mã giảm giá'} 
                      className="form-control me-2"
                      style={{ maxWidth: '300px' }}
                    />
                    <button type="submit" className="theme-btn">
                      {t('shop.cart.applyCoupon') || 'Áp dụng'}
                    </button>
                  </form>
                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button className="theme-btn style-2" onClick={handleClearCart}>
                      <i className="fa-solid fa-trash me-2"></i> {t('shop.cart.clearCart') || 'Xóa giỏ hàng'}
                    </button>
                    <Link to="/shop" className="theme-btn">
                      <i className="fa-solid fa-arrow-left me-2"></i> {t('shop.cart.continueShopping') || 'Tiếp tục mua sắm'}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="col-xl-4">
                <div className="cart-sidebar">
                  <div className="cart-sidebar-widget mb-4">
                    <h4 className="mb-3">{t('shop.cart.cartTotals') || 'Tổng giỏ hàng'}</h4>
                    <div className="cart-total">
                      <ul>
                        <li>
                          <span>{t('shop.cart.subtotal') || 'Tạm tính'}:</span>
                          <span>{formatPrice(subtotal)}</span>
                        </li>
                        <li>
                          <span>{t('shop.cart.shipping') || 'Phí vận chuyển'}:</span>
                          <span>
                            {shipping === 0 ? (
                              <span className="text-success">{t('shop.cart.freeShipping') || 'Miễn phí'}</span>
                            ) : (
                              formatPrice(shipping)
                            )}
                          </span>
                        </li>
                        {subtotal < 200000 && (
                          <li className="border-0">
                            <small className="text-muted">
                              <i className="fa-solid fa-circle-info me-1"></i>
                              Mua thêm {formatPrice(200000 - subtotal)} để được miễn phí ship
                            </small>
                          </li>
                        )}
                      </ul>
                      <div className="cart-total-price">
                        <span>{t('shop.cart.grandTotal') || 'Tổng cộng'}:</span>
                        <span className="text-danger fw-bold">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Link to="/checkout" className="theme-btn w-100 text-center mb-3">
                    <i className="fa-solid fa-credit-card me-2"></i> {t('shop.cart.checkout') || 'Thanh toán'}
                  </Link>

                  {/* Payment Methods */}
                  <div className="payment-methods mt-3">
                    <h6 className="mb-2">{t('shop.cart.paymentMethods') || 'Phương thức thanh toán'}:</h6>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      <i className="fa-brands fa-cc-visa fa-2x text-primary"></i>
                      <i className="fa-brands fa-cc-mastercard fa-2x text-warning"></i>
                      <i className="fa-brands fa-cc-paypal fa-2x text-info"></i>
                      <i className="fa-solid fa-money-bill-wave fa-2x text-success"></i>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="security-badge mt-4 p-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <i className="fa-solid fa-shield-check fa-2x text-success me-3"></i>
                      <div>
                        <h6 className="mb-0">{t('shop.cart.securePayment') || 'Thanh toán an toàn'}</h6>
                        <small className="text-muted">{t('shop.cart.ssl256') || 'Mã hóa SSL 256-bit'}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopCartPage;
