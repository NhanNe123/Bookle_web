import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const placeholderAvatar = '/assets/img/icon/icon-9.svg';

const ProfilePage = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
        message: 'Bạn chưa thay đổi thông tin nào.'
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
        message: response.message || 'Cập nhật thông tin thành công.'
      });

      setAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Cập nhật thông tin thất bại.'
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
            <h1>Thông tin tài khoản</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">Trang chủ</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>Thông tin tài khoản</li>
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
                    <h3 className="mb-3">Vui lòng đăng nhập</h3>
                    <p className="mb-4">
                      Bạn cần đăng nhập để xem và chỉnh sửa thông tin tài khoản của mình.
                    </p>
                    <Link to="/" className="theme-btn">
                      Về trang chủ
                      <i className="fa-solid fa-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row justify-content-center">
              <div className="col-lg-4">
                <div className="card shadow-sm border-0 mb-4 mb-lg-0">
                  <div className="card-body text-center p-4">
                    <div
                      className="mx-auto mb-3"
                      style={{
                        width: '140px',
                        height: '140px',
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
                    <h4 className="mb-1">{user?.name || 'Người dùng'}</h4>
                    <p className="text-muted mb-0">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card shadow-sm border-0">
                  <div className="card-body p-4">
                    <h4 className="mb-3">Chỉnh sửa thông tin</h4>
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                          Họ và tên
                        </label>
                        <input
                          id="name"
                          type="text"
                          className="form-control"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>

                      <div className="mb-3">
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
                          Email được dùng để đăng nhập và không thể thay đổi.
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="avatar">
                          Ảnh đại diện
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
                              Hủy ảnh mới
                            </button>
                          )}
                        </div>
                        <div className="form-text">
                          Hỗ trợ JPG, PNG, GIF, WEBP với kích thước tối đa 2MB.
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="theme-btn d-inline-flex align-items-center"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="small" variant="dots" className="me-2" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            Lưu thay đổi
                            <i className="fa-solid fa-floppy-disk ms-2"></i>
                          </>
                        )}
                      </button>
                    </form>
                    {renderStatusAlert()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ProfilePage;

