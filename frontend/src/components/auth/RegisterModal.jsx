import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const RegisterModal = ({ onSwitchToLogin, onClose }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData.name, formData.email, formData.password);
      if (result.success) {
        onClose();
        // Show success notification with email verification info
        setTimeout(() => {
          alert(`Chào mừng ${result.user.name}!\n\n✅ Tài khoản đã được tạo thành công.\n📧 Một email xác thực đã được gửi đến ${formData.email}.\n\nVui lòng kiểm tra hộp thư và click vào link để xác thực tài khoản.`);
        }, 100);
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ display: 'block' }} 
        id="registrationModal" 
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
                  <h1>Tạo tài khoản!</h1>
                  
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <input 
                      className="inputField" 
                      type="text" 
                      name="name" 
                      placeholder="Tên người dùng"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
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
                    <input 
                      className="inputField" 
                      type="password" 
                      name="confirmPassword" 
                      placeholder="Xác nhận mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    
                    <div className="input-check remember-me">
                      <div className="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          name="rememberMe"
                          id="rememberMeRegister"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                        />
                        <label htmlFor="rememberMeRegister">Ghi nhớ đăng nhập</label>
                      </div>
                      <div className="text">
                        <a href="#" onClick={(e) => e.preventDefault()}>Quên mật khẩu?</a>
                      </div>
                    </div>

                    <div className="loginBtn">
                      <button type="submit" className="theme-btn rounded-0" disabled={loading}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
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
                        Đã có tài khoản?{' '}
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            onSwitchToLogin();
                          }}
                          className="text-primary fw-bold"
                          style={{ textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Đăng nhập ngay
                        </a>
                      </p>
                    </div>
                  </form>
                </div>

                <div className="banner">
                  <button 
                    type="button" 
                    className="rounded-0 login-btn"
                    onClick={onSwitchToLogin}
                  >
                    Đăng nhập
                  </button>
                  <button 
                    type="button" 
                    className="theme-btn rounded-0 register-btn active"
                  >
                    Tạo tài khoản
                  </button>
                  <div className="signUpBg">
                    <img src="/assets/img/registrationbg.jpg" alt="signUpBg" />
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

export default RegisterModal;

