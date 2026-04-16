import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProductImage } from '../utils/categoryUtils';

const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    notes: '',
    paymentMethod: 'cod',
    shippingMethod: 'standard'
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!orderSuccess && cart.length === 0) {
      navigate('/shop-cart');
    }
  }, [cart, navigate, orderSuccess]);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  // Calculate shipping fee
  const calculateShippingFee = () => {
    const subtotal = getCartTotal();
    if (subtotal >= 200000) return 0;
    
    const majorCities = ['hà nội', 'tp.hcm', 'hồ chí minh', 'tp. hồ chí minh', 'đà nẵng'];
    const cityLower = formData.city.toLowerCase();
    
    if (majorCities.some(c => cityLower.includes(c))) {
      return 20000;
    }
    return formData.city ? 35000 : 0;
  };

  const subtotal = getCartTotal();
  const shippingFee = calculateShippingFee();
  const total = subtotal + shippingFee;

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = t('checkout.errors.fullNameRequired');
    }
    
    if (!formData.phone.trim()) {
      errors.phone = t('checkout.errors.phoneRequired');
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = t('checkout.errors.phoneInvalid');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('checkout.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('checkout.errors.emailInvalid');
    }
    
    if (!formData.address.trim()) {
      errors.address = t('checkout.errors.addressRequired');
    }
    
    if (!formData.district.trim()) {
      errors.district = t('checkout.errors.districtRequired');
    }
    
    if (!formData.city.trim()) {
      errors.city = t('checkout.errors.cityRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.replace(/\s/g, ''),
          email: formData.email.trim().toLowerCase(),
          address: formData.address.trim(),
          ward: formData.ward.trim(),
          district: formData.district.trim(),
          city: formData.city.trim(),
          notes: formData.notes.trim(),
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        customerNotes: formData.notes
      };
      
      const response = await ordersAPI.createOrder(orderData);
      
      if (response.success) {
        setOrderSuccess(response.order);
        clearCart();
      } else {
        setError(response.error || t('checkout.errors.orderFailed'));
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const data = err.response?.data;
      const msg =
        (data && typeof data.error === 'string' && data.error) ||
        (data && typeof data.message === 'string' && data.message) ||
        t('checkout.errors.orderFailed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Order success view
  if (orderSuccess) {
    return (
      <>
        <div className="breadcrumb-wrapper">
          <div className="container">
            <div className="page-heading">
              <h1>{t('checkout.success.title')}</h1>
            </div>
          </div>
        </div>

        <section className="checkout-section section-padding">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center p-5">
                    <div className="mb-4">
                      <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '80px' }}></i>
                    </div>
                    <h2 className="mb-3">{t('checkout.success.thankYou')}</h2>
                    <p className="text-muted mb-4">
                      {t('checkout.success.orderPlaced')}
                    </p>
                    
                    <div className="order-info bg-light rounded p-4 mb-4">
                      <div className="row">
                        <div className="col-sm-6 mb-3 mb-sm-0">
                          <p className="text-muted mb-1">{t('checkout.success.orderNumber')}</p>
                          <h4 className="mb-0 text-primary">{orderSuccess.orderNumber}</h4>
                        </div>
                        <div className="col-sm-6">
                          <p className="text-muted mb-1">{t('checkout.success.total')}</p>
                          <h4 className="mb-0">{formatPrice(orderSuccess.total)}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info mb-4">
                      <i className="fa-solid fa-info-circle me-2"></i>
                      {formData.paymentMethod === 'cod' 
                        ? t('checkout.success.codMessage')
                        : t('checkout.success.bankTransferMessage')
                      }
                    </div>

                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      {isAuthenticated && (
                        <Link to="/profile" className="theme-btn">
                          <i className="fa-solid fa-box me-2"></i>
                          {t('checkout.success.viewOrders')}
                        </Link>
                      )}
                      <Link to="/shop" className="theme-btn style-2">
                        <i className="fa-solid fa-shopping-bag me-2"></i>
                        {t('checkout.success.continueShopping')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

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
            <h1>{t('checkout.title')}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{t('header.menu.home')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>
                  <Link to="/shop-cart">{t('checkout.cart')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{t('checkout.title')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Section */}
      <section className="checkout-section section-padding">
        <div className="container">
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <i className="fa-solid fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Shipping Information */}
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0">
                      <i className="fa-solid fa-truck me-2"></i>
                      {t('checkout.shippingInfo')}
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">{t('checkout.fullName')} *</label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.fullName')}
                        />
                        {formErrors.fullName && (
                          <div className="invalid-feedback">{formErrors.fullName}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6">
                        <label className="form-label">{t('checkout.phone')} *</label>
                        <input
                          type="tel"
                          className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.phone')}
                        />
                        {formErrors.phone && (
                          <div className="invalid-feedback">{formErrors.phone}</div>
                        )}
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label">{t('checkout.email')} *</label>
                        <input
                          type="email"
                          className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.email')}
                        />
                        {formErrors.email && (
                          <div className="invalid-feedback">{formErrors.email}</div>
                        )}
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label">{t('checkout.address')} *</label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.address ? 'is-invalid' : ''}`}
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.address')}
                        />
                        {formErrors.address && (
                          <div className="invalid-feedback">{formErrors.address}</div>
                        )}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">{t('checkout.ward')}</label>
                        <input
                          type="text"
                          className="form-control"
                          name="ward"
                          value={formData.ward}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.ward')}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">{t('checkout.district')} *</label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.district ? 'is-invalid' : ''}`}
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.district')}
                        />
                        {formErrors.district && (
                          <div className="invalid-feedback">{formErrors.district}</div>
                        )}
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">{t('checkout.city')} *</label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.city ? 'is-invalid' : ''}`}
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.city')}
                        />
                        {formErrors.city && (
                          <div className="invalid-feedback">{formErrors.city}</div>
                        )}
                      </div>
                      
                      <div className="col-12">
                        <label className="form-label">{t('checkout.notes')}</label>
                        <textarea
                          className="form-control"
                          name="notes"
                          rows="3"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder={t('checkout.placeholders.notes')}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="card border-0 shadow-sm mt-4">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0">
                      <i className="fa-solid fa-credit-card me-2"></i>
                      {t('checkout.paymentMethod')}
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="payment-options">
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          id="cod"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label d-flex align-items-center" htmlFor="cod">
                          <i className="fa-solid fa-money-bill-wave me-2 text-success"></i>
                          <div>
                            <strong>{t('checkout.payment.cod')}</strong>
                            <small className="d-block text-muted">{t('checkout.payment.codDesc')}</small>
                          </div>
                        </label>
                      </div>
                      
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          id="bank_transfer"
                          value="bank_transfer"
                          checked={formData.paymentMethod === 'bank_transfer'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label d-flex align-items-center" htmlFor="bank_transfer">
                          <i className="fa-solid fa-building-columns me-2 text-primary"></i>
                          <div>
                            <strong>{t('checkout.payment.bankTransfer')}</strong>
                            <small className="d-block text-muted">{t('checkout.payment.bankTransferDesc')}</small>
                          </div>
                        </label>
                      </div>
                      
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          id="momo"
                          value="momo"
                          checked={formData.paymentMethod === 'momo'}
                          onChange={handleChange}
                        />
                        <label className="form-check-label d-flex align-items-center" htmlFor="momo">
                          <i className="fa-solid fa-wallet me-2" style={{ color: '#ae2070' }}></i>
                          <div>
                            <strong>{t('checkout.payment.momo')}</strong>
                            <small className="d-block text-muted">{t('checkout.payment.momoDesc')}</small>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0">
                      <i className="fa-solid fa-shopping-basket me-2"></i>
                      {t('checkout.orderSummary')}
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    {/* Cart Items */}
                    <div className="order-items mb-4">
                      {cart.map((item) => (
                        <div key={item._id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                          <div className="cart-thumb-frame cart-thumb-frame--compact">
                            <img
                              src={getProductImage(item.images, item.coverImage)}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div className="ms-3 flex-grow-1">
                            <h6 className="mb-1" style={{ fontSize: '14px' }}>{item.name}</h6>
                            <small className="text-muted">
                              {formatPrice(item.price)} x {item.quantity}
                            </small>
                          </div>
                          <div className="text-end">
                            <strong>{formatPrice(item.price * item.quantity)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="order-totals">
                      <div className="d-flex justify-content-between mb-2">
                        <span>{t('checkout.subtotal')}</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>{t('checkout.shipping')}</span>
                        <span>
                          {shippingFee === 0 
                            ? <span className="text-success">{t('checkout.freeShipping')}</span>
                            : formatPrice(shippingFee)
                          }
                        </span>
                      </div>
                      {subtotal < 200000 && (
                        <div className="alert alert-info py-2 mb-3" style={{ fontSize: '13px' }}>
                          <i className="fa-solid fa-info-circle me-1"></i>
                          {t('checkout.freeShippingNote', { amount: formatPrice(200000 - subtotal) })}
                        </div>
                      )}
                      <hr />
                      <div className="d-flex justify-content-between mb-4">
                        <strong className="fs-5">{t('checkout.total')}</strong>
                        <strong className="fs-5 text-primary">{formatPrice(total)}</strong>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="theme-btn w-100"
                      disabled={loading || cart.length === 0}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="small" variant="dots" className="me-2" />
                          {t('checkout.processing')}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-lock me-2"></i>
                          {t('checkout.placeOrder')}
                        </>
                      )}
                    </button>

                    <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '13px' }}>
                      <i className="fa-solid fa-shield-check me-1"></i>
                      {t('checkout.securePayment')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default CheckoutPage;
