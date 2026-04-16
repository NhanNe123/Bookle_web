import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getProductImage } from '../utils/categoryUtils';

const placeholderAvatar = '/assets/img/icon/icon-9.svg';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Orders state
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar || '');
      setAvatarFile(null);
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch orders when tab changes to orders
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      fetchOrders();
    }
  }, [activeTab, isAuthenticated, orderFilter]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const params = orderFilter !== 'all' ? { status: orderFilter } : {};
      const response = await ordersAPI.getOrders(params);
      if (response.success) {
        setOrders(response.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrdersError(t('orders.error'));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await ordersAPI.cancelOrder(orderId, cancelReason);
      if (response.success) {
        setCancellingOrder(null);
        setCancelReason('');
        fetchOrders();
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.error || t('orders.cancelError'));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipping: 'primary',
      delivered: 'success',
      cancelled: 'danger',
      refunded: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(nextUrl);
    setPreviewUrl(nextUrl);
    setStatus(null);
  };

  const handleResetAvatar = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return;

    const trimmedName = name.trim();
    const hasNameChanged = trimmedName && trimmedName !== (user?.name || '');
    const hasAvatarChanged = Boolean(avatarFile);

    if (!hasNameChanged && !hasAvatarChanged) {
      setStatus({
        type: 'info',
        message: t('profile.noChanges')
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const payload = {};

      if (hasNameChanged) {
        payload.name = trimmedName;
      }

      if (hasAvatarChanged) {
        payload.avatar = avatarFile;
      }

      const response = await updateProfile(payload);

      setStatus({
        type: 'success',
        message: response.message || t('profile.updateSuccess')
      });

      setAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || t('profile.updateFailed')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusAlert = () => {
    if (!status) return null;

    const variantMap = {
      success: 'success',
      error: 'danger',
      info: 'info'
    };

    const alertClass = `alert alert-${variantMap[status.type] || 'secondary'} mt-3 mb-0`;

    return (
      <div className={alertClass} role="alert">
        {status.message}
      </div>
    );
  };

  const avatarSrc = avatarPreview || placeholderAvatar;

  return (
    <>
      <div className="breadcrumb-wrapper">
        <div className="book1">
          <img src="/assets/img/hero/book1.png" alt="book" />
        </div>
        <div className="book2">
          <img src="/assets/img/hero/book2.png" alt="book" />
        </div>
        <div className="container">
          <div className="page-heading">
            <h1>{t('profile.title')}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{t('header.menu.home')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{t('profile.title')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="section-padding">
        <div className="container">
          {!isAuthenticated ? (
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 text-center p-5">
                  <div className="card-body">
                    <div className="mb-4">
                      <i className="fa-solid fa-circle-user fa-4x text-muted"></i>
                    </div>
                    <h3 className="mb-3">{t('profile.loginRequired')}</h3>
                    <p className="mb-4">
                      {t('profile.loginRequiredDesc')}
                    </p>
                    <Link to="/" className="theme-btn">
                      {t('profile.backToHome')}
                      <i className="fa-solid fa-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              {/* Sidebar */}
              <div className="col-lg-3 mb-4">
                <div className="card shadow-sm border-0">
                  <div className="card-body text-center p-4">
                    <div
                      className="mx-auto mb-3"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid rgba(48, 64, 214, 0.1)',
                        backgroundColor: '#f5f7ff'
                      }}
                    >
                      <img
                        src={avatarSrc}
                        alt="Avatar"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: avatarPreview ? 'cover' : 'contain'
                        }}
                      />
                    </div>
                    <h5 className="mb-1">{user?.name || 'Người dùng'}</h5>
                    <p className="text-muted small mb-3">{user?.email}</p>
                  </div>
                  <div className="list-group list-group-flush">
                    <button
                      className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <i className="fa-solid fa-user me-3"></i>
                      {t('profile.tabs.profile')}
                    </button>
                    <button
                      className={`list-group-item list-group-item-action d-flex align-items-center ${activeTab === 'orders' ? 'active' : ''}`}
                      onClick={() => setActiveTab('orders')}
                    >
                      <i className="fa-solid fa-box me-3"></i>
                      {t('profile.tabs.orders')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="col-lg-9">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="card shadow-sm border-0">
                    <div className="card-header bg-white py-3">
                      <h5 className="mb-0">
                        <i className="fa-solid fa-user-pen me-2"></i>
                        {t('profile.editProfile')}
                      </h5>
                    </div>
                    <div className="card-body p-4">
                      <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                          <div className="col-md-6">
                            <label htmlFor="name" className="form-label">
                              {t('profile.fullName')}
                            </label>
                            <input
                              id="name"
                              type="text"
                              className="form-control"
                              value={name}
                              onChange={(event) => setName(event.target.value)}
                              placeholder={t('profile.placeholders.fullName')}
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="email" className="form-label">
                              Email
                            </label>
                            <input
                              id="email"
                              type="email"
                              className="form-control"
                              value={email}
                              disabled
                              readOnly
                            />
                            <div className="form-text">
                              {t('profile.emailNote')}
                            </div>
                          </div>

                          <div className="col-12">
                            <label className="form-label" htmlFor="avatar">
                              {t('profile.avatar')}
                            </label>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <input
                                id="avatar"
                                type="file"
                                className="form-control"
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handleAvatarChange}
                              />
                              {avatarFile && (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={handleResetAvatar}
                                >
                                  {t('profile.cancelAvatar')}
                                </button>
                              )}
                            </div>
                            <div className="form-text">
                              {t('profile.avatarNote')}
                            </div>
                          </div>

                          <div className="col-12">
                            <button
                              type="submit"
                              className="theme-btn d-inline-flex align-items-center"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <LoadingSpinner size="small" variant="dots" className="me-2" />
                                  {t('profile.saving')}
                                </>
                              ) : (
                                <>
                                  {t('profile.saveChanges')}
                                  <i className="fa-solid fa-floppy-disk ms-2"></i>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                      {renderStatusAlert()}
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="card shadow-sm border-0">
                    <div className="card-header bg-white py-3">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <h5 className="mb-0">
                          <i className="fa-solid fa-box me-2"></i>
                          {t('orders.title')}
                        </h5>
                        <div className="btn-group btn-group-sm">
                          {['all', 'pending', 'processing', 'shipping', 'delivered', 'cancelled'].map((filter) => (
                            <button
                              key={filter}
                              className={`btn ${orderFilter === filter ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setOrderFilter(filter)}
                            >
                              {t(`orders.filter.${filter}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="card-body p-4">
                      {ordersLoading ? (
                        <div className="text-center py-5">
                          <LoadingSpinner size="large" variant="spinner" text={t('common.loading')} />
                        </div>
                      ) : ordersError ? (
                        <div className="alert alert-danger">{ordersError}</div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="fa-solid fa-box-open fa-4x text-muted mb-4"></i>
                          <h5>{t('orders.empty')}</h5>
                          <p className="text-muted">{t('orders.emptyDesc')}</p>
                          <Link to="/shop" className="theme-btn">
                            {t('orders.shopNow')}
                          </Link>
                        </div>
                      ) : (
                        <div className="orders-list">
                          {orders.map((order) => (
                            <div key={order._id} className="order-item card mb-3">
                              <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                  <strong>{t('orders.orderNumber')}: </strong>
                                  <span className="text-primary">{order.orderNumber}</span>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                  <small className="text-muted">
                                    {formatDate(order.createdAt)}
                                  </small>
                                  <span className={`badge bg-${getStatusColor(order.status)}`}>
                                    {t(`orders.statusLabels.${order.status}`)}
                                  </span>
                                </div>
                              </div>
                              <div className="card-body">
                                <div className="row align-items-center">
                                  <div className="col-md-6">
                                    <div className="order-items-preview d-flex gap-2 flex-wrap">
                                      {order.items.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="d-flex align-items-center gap-2 bg-light rounded p-2">
                                          <div className="book-mini-cover book-mini-cover--xs">
                                            <img
                                              src={getProductImage(item.image ? [item.image] : [])}
                                              alt={item.name}
                                            />
                                          </div>
                                          <div>
                                            <small className="d-block" style={{ maxWidth: '150px' }}>
                                              {item.name.length > 25 ? item.name.slice(0, 25) + '...' : item.name}
                                            </small>
                                            <small className="text-muted">x{item.quantity}</small>
                                          </div>
                                        </div>
                                      ))}
                                      {order.items.length > 3 && (
                                        <div className="d-flex align-items-center justify-content-center bg-light rounded p-2">
                                          <small className="text-muted">+{order.items.length - 3}</small>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="col-md-3 text-md-center mt-3 mt-md-0">
                                    <small className="text-muted d-block">{t('orders.total')}</small>
                                    <strong className="text-primary">{formatPrice(order.total)}</strong>
                                  </div>
                                  <div className="col-md-3 text-md-end mt-3 mt-md-0">
                                    <div className="d-flex gap-2 justify-content-md-end">
                                      <Link 
                                        to={`/order/${order.orderNumber}`} 
                                        className="btn btn-outline-primary btn-sm"
                                      >
                                        {t('orders.viewDetails')}
                                      </Link>
                                      {['pending', 'confirmed'].includes(order.status) && (
                                        <button
                                          className="btn btn-outline-danger btn-sm"
                                          onClick={() => setCancellingOrder(order)}
                                        >
                                          {t('orders.cancel')}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('orders.cancel')}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setCancellingOrder(null);
                      setCancelReason('');
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>{t('orders.cancelConfirm')}</p>
                  <p className="mb-2">
                    <strong>{t('orders.orderNumber')}:</strong> {cancellingOrder.orderNumber}
                  </p>
                  <div className="mb-3">
                    <label className="form-label">{t('orders.cancelReason')}</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder={t('orders.cancelReasonPlaceholder')}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setCancellingOrder(null);
                      setCancelReason('');
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={() => handleCancelOrder(cancellingOrder._id)}
                  >
                    {t('orders.confirmCancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  );
};

export default ProfilePage;
