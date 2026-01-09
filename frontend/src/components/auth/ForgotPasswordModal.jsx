import React, { useState } from 'react';
import api from '../../lib/api';

const ForgotPasswordModal = ({ onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gửi email thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ display: 'block' }} 
        id="forgotPasswordModal" 
        tabIndex="-1"
        onClick={(e) => {
          if (e.target.classList.contains('modal')) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-body">
              <div className="close-btn">
                <button type="button" className="btn-close" onClick={onClose}></button>
              </div>
              <div className="identityBox">
                <div className="form-wrapper">
                  <h1>Quên mật khẩu?</h1>
                  <p className="text-muted mb-4">
                    Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
                  </p>
                  
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success" role="alert">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <input 
                      className="inputField" 
                      type="email" 
                      name="email" 
                      placeholder="Địa chỉ Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <div className="loginBtn">
                      <button type="submit" className="theme-btn rounded-0" disabled={loading || success}>
                        {loading ? 'Đang gửi...' : success ? 'Đã gửi!' : 'Gửi link đặt lại'}
                      </button>
                    </div>

                    <div className="text-center mt-3">
                      <p className="mb-0">
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            onBackToLogin();
                          }}
                          className="text-primary fw-bold"
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          ← Quay lại đăng nhập
                        </a>
                      </p>
                    </div>
                  </form>
                </div>

                <div className="banner">
                  <button 
                    type="button" 
                    className="rounded-0 login-btn"
                    onClick={onBackToLogin}
                  >
                    Đăng nhập
                  </button>
                  <div className="loginBg">
                    <img src="/assets/img/signUpbg.jpg" alt="signUpBg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordModal;

