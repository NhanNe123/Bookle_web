import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const LoginModal = ({ onSwitchToRegister, onClose, onShowForgotPassword }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password, formData.rememberMe);
      if (result.success) {
        onClose();
        // Show success notification
        setTimeout(() => {
          alert(`Chào mừng ${result.user.name}!`);
        }, 100);
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ display: 'block' }} 
        id="loginModal" 
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
                  <h1>Chào mừng trở lại!</h1>
                  
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <input 
                      className="inputField" 
                      type="email" 
                      name="email" 
                      placeholder="Địa chỉ Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <input 
                      className="inputField" 
                      type="password" 
                      name="password" 
                      placeholder="Mật khẩu"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    
                    <div className="input-check remember-me">
                      <div className="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          name="rememberMe"
                          id="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                        />
                        <label htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
                      </div>
                      <div className="text">
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (onShowForgotPassword) {
                              onShowForgotPassword();
                            }
                          }}
                        >
                          Quên mật khẩu?
                        </a>
                      </div>
                    </div>

                    <div className="loginBtn">
                      <button type="submit" className="theme-btn rounded-0" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                      </button>
                    </div>

                    <div className="orting-badge">Hoặc</div>

                    <div>
                      <a className="another-option" href="/api/auth/google">
                        <img src="/assets/img/google.png" alt="google" />
                        Tiếp tục với Google
                      </a>
                    </div>

                    <div>
                      <a className="another-option another-option-two" href="/api/auth/facebook">
                        <img src="/assets/img/facebook.png" alt="facebook" />
                        Tiếp tục với Facebook
                      </a>
                    </div>

                    <div className="text-center mt-3">
                      <p className="mb-0">
                        Chưa có tài khoản?{' '}
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            onSwitchToRegister();
                          }}
                          className="text-primary fw-bold"
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Đăng ký ngay
                        </a>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;

