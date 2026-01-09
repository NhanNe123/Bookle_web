import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

const ShopCartPage = () => {
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
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      removeFromCart(productId);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <>
        {/* Breadcrumb */}
        <div className="breadcrumb-wrapper">
          <div className="container">
            <div className="page-heading">
              <h1>Giỏ hàng</h1>
              <div className="page-header">
                <ul className="breadcrumb-items">
                  <li><Link to="/">Trang chủ</Link></li>
                  <li><i className="fa-solid fa-chevron-right"></i></li>
                  <li>Giỏ hàng</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <section className="cart-section section-padding">
          <div className="container">
            <div className="text-center py-5">
              <i className="fa-solid fa-cart-shopping fa-4x text-muted mb-3"></i>
              <h3>Giỏ hàng trống</h3>
              <p className="text-muted mb-4">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
              <Link to="/shop" className="theme-btn">
                <i className="fa-solid fa-arrow-left"></i> Tiếp tục mua sắm
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
        <div className="container">
          <div className="page-heading">
            <h1>Giỏ hàng</h1>
            <div className="page-header">
              <ul className="breadcrumb-items">
                <li><Link to="/">Trang chủ</Link></li>
                <li><i className="fa-solid fa-chevron-right"></i></li>
                <li>Giỏ hàng</li>
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
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Số lượng</th>
                        <th>Tổng</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="cart-product-items d-flex align-items-center">
                              <div className="product-image">
                                <Link to={`/shop-details/${item.slug || item._id}`}>
                                  <img 
                                    src={item.images?.[0] || '/assets/img/book/01.png'} 
                                    alt={item.name}
                                    style={{ width: '80px', height: 'auto', objectFit: 'cover' }}
                                  />
                                </Link>
                              </div>
                              <div className="product-content ms-3">
                                <h4>
                                  <Link to={`/shop-details/${item.slug || item._id}`}>
                                    {item.name}
                                  </Link>
                                </h4>
                                {item.author && (
                                  <p className="text-muted mb-0 small">Tác giả: {item.author}</p>
                                )}
                                {item.stock <= 5 && item.stock > 0 && (
                                  <p className="text-warning mb-0 small">
                                    <i className="fa-solid fa-triangle-exclamation"></i> Chỉ còn {item.stock} sản phẩm
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <h6 className="mb-0">{formatPrice(item.price)}</h6>
                            {item.compareAtPrice && item.compareAtPrice > item.price && (
                              <del className="text-muted small">{formatPrice(item.compareAtPrice)}</del>
                            )}
                          </td>
                          <td>
                            <div className="quantity-basket">
                              <p className="qty d-inline-flex">
                                <button 
                                  className="qtyminus"
                                  onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.stock)}
                                  disabled={item.quantity <= 1}
                                >
                                  −
                                </button>
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item._id, e.target.value, item.stock)}
                                  min="1"
                                  max={item.stock || 999}
                                  style={{ width: '60px', textAlign: 'center' }}
                                />
                                <button 
                                  className="qtyplus"
                                  onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.stock)}
                                  disabled={item.quantity >= (item.stock || 999)}
                                >
                                  +
                                </button>
                              </p>
                            </div>
                          </td>
                          <td>
                            <h6 className="mb-0">{formatPrice(item.price * item.quantity)}</h6>
                          </td>
                          <td>
                            <button 
                              className="remove-icon"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cart Actions */}
                <div className="cart-wrapper-footer mt-4">
                  <form className="d-flex align-items-center">
                    <input 
                      type="text" 
                      placeholder="Mã giảm giá" 
                      className="form-control me-2"
                      style={{ maxWidth: '300px' }}
                    />
                    <button type="submit" className="theme-btn">
                      Áp dụng
                    </button>
                  </form>
                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button className="theme-btn style-2" onClick={handleClearCart}>
                      <i className="fa-solid fa-trash"></i> Xóa giỏ hàng
                    </button>
                    <Link to="/shop" className="theme-btn">
                      <i className="fa-solid fa-arrow-left"></i> Tiếp tục mua
                    </Link>
                  </div>
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="col-xl-4">
                <div className="cart-sidebar">
                  <div className="cart-sidebar-widget mb-4">
                    <h4 className="mb-3">Tổng giỏ hàng</h4>
                    <div className="cart-total">
                      <ul>
                        <li>
                          <span>Tạm tính:</span>
                          <span>{formatPrice(subtotal)}</span>
                        </li>
                        <li>
                          <span>Phí vận chuyển:</span>
                          <span>
                            {shipping === 0 ? (
                              <span className="text-success">Miễn phí</span>
                            ) : (
                              formatPrice(shipping)
                            )}
                          </span>
                        </li>
                        {subtotal < 200000 && (
                          <li className="border-0">
                            <small className="text-muted">
                              <i className="fa-solid fa-circle-info"></i> Mua thêm {formatPrice(200000 - subtotal)} để được miễn phí ship
                            </small>
                          </li>
                        )}
                      </ul>
                      <div className="cart-total-price">
                        <span>Tổng cộng:</span>
                        <span className="text-danger fw-bold">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Link to="/checkout" className="theme-btn w-100 text-center mb-3">
                    <i className="fa-solid fa-credit-card"></i> Thanh toán
                  </Link>

                  {/* Payment Methods */}
                  <div className="payment-methods mt-3">
                    <h6 className="mb-2">Phương thức thanh toán:</h6>
                    <div className="d-flex gap-2 flex-wrap">
                      <img src="/assets/img/visa.png" alt="Visa" style={{ height: '30px' }} />
                      <img src="/assets/img/mastercard.png" alt="Mastercard" style={{ height: '30px' }} />
                      <img src="/assets/img/paypal.png" alt="PayPal" style={{ height: '30px' }} />
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="security-badge mt-4 p-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <i className="fa-solid fa-lock fa-2x text-success me-3"></i>
                      <div>
                        <h6 className="mb-0">Thanh toán an toàn</h6>
                        <small className="text-muted">Mã hóa SSL 256-bit</small>
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
