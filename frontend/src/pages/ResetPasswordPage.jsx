import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container" style={{ minHeight: '60vh', paddingTop: '100px' }}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger text-center">
              <h4>Link không hợp lệ</h4>
              <p>Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <a href="/" className="btn btn-primary">Về trang chủ</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '60vh', paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="identityBox" style={{ margin: '0 auto' }}>
            <div className="form-wrapper">
              <h1>Đặt lại mật khẩu</h1>
              <p className="text-muted mb-4">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                  <br />
                  <small>Đang chuyển về trang chủ...</small>
                </div>
              )}

              {!success && (
                <form onSubmit={handleSubmit}>
                  <input
                    className="inputField"
                    type="password"
                    name="newPassword"
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />

                  <input
                    className="inputField"
                    type="password"
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />

                  <div className="loginBtn">
                    <button type="submit" className="theme-btn rounded-0" disabled={loading}>
                      {loading ? (
                        <>
                          <LoadingSpinner size="small" variant="dots" className="me-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        'Đặt lại mật khẩu'
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-3">
                <a href="/" className="text-primary fw-bold">
                  ← Về trang chủ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

