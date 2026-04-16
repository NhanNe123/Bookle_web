import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventsAPI } from '../../lib/api';

/** Toast đơn giản (không thêm dependency) */
function ToastBanner({ message, type, onDismiss }) {
  if (!message) return null;
  const bg =
    type === 'error' ? '#b91c1c' : type === 'success' ? '#15803d' : '#0f172a';
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        maxWidth: 360,
        padding: '14px 18px',
        borderRadius: 12,
        background: bg,
        color: '#fff',
        boxShadow: '0 12px 40px rgba(15,23,42,0.25)',
        zIndex: 9999,
        fontSize: '14px',
        lineHeight: 1.45,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          border: 'none',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          borderRadius: 8,
          cursor: 'pointer',
          padding: '4px 10px',
          fontSize: 16,
          lineHeight: 1,
        }}
        aria-label="Đóng"
      >
        ×
      </button>
    </div>
  );
}

function toDatetimeLocalValue(d) {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  const y = x.getFullYear();
  const m = pad(x.getMonth() + 1);
  const day = pad(x.getDate());
  const h = pad(x.getHours());
  const min = pad(x.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

/**
 * Trang quản trị: tạo sự kiện + Trợ lý AI (Gemini).
 * Đường dẫn: /admin/events — cần đăng nhập tài khoản role admin (session cookie).
 */
const AdminEventForm = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toastTimer = useRef(null);

  const [toast, setToast] = useState({ message: '', type: 'info' });
  const showToast = useCallback((message, type = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5200);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message: '', type: 'info' });
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(() =>
    toDatetimeLocalValue(Date.now())
  );
  const [endDate, setEndDate] = useState(() =>
    toDatetimeLocalValue(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [isActive, setIsActive] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#036280');
  const [secondaryColor, setSecondaryColor] = useState('#FF6500');
  const [decorationType, setDecorationType] = useState('none');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [targetCategoriesText, setTargetCategoriesText] = useState('');
  const [suggestedSlogan, setSuggestedSlogan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAISuggestion = async () => {
    if (!aiPrompt.trim()) {
      showToast('Vui lòng nhập ý tưởng sự kiện (ví dụ: Tết Trung Thu).', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const data = await eventsAPI.suggest(aiPrompt.trim());
      if (!data?.success || !data.suggestion) {
        showToast(data?.error || 'AI không trả về dữ liệu hợp lệ.', 'error');
        return;
      }
      const s = data.suggestion;
      setName(s.name || '');
      if (s.themeConfig) {
        setPrimaryColor(s.themeConfig.primaryColor || primaryColor);
        setSecondaryColor(s.themeConfig.secondaryColor || secondaryColor);
        setDecorationType(s.themeConfig.decorationType || 'none');
      }
      if (s.discountConfig) {
        const p = Number(s.discountConfig.discountPercent);
        if (!Number.isNaN(p)) setDiscountPercent(p);
        if (Array.isArray(s.discountConfig.targetCategories) && s.discountConfig.targetCategories.length) {
          setTargetCategoriesText(s.discountConfig.targetCategories.join(', '));
        }
      }
      if (s.suggestedSlogan) setSuggestedSlogan(s.suggestedSlogan);
      showToast('Đã áp dụng gợi ý AI vào form.', 'success');
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'Không gọi được AI. Kiểm tra GEMINI_API_KEY và đăng nhập admin.';
      showToast(msg, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nhập tên sự kiện.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const targetCategories = targetCategoriesText
        .split(/[,;\n]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      const payload = {
        name: name.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
        themeConfig: {
          primaryColor,
          secondaryColor,
          decorationType,
        },
        discountConfig: {
          discountPercent: Number(discountPercent) || 0,
          targetCategories,
        },
      };
      const res = await eventsAPI.create(payload);
      if (res?.success) {
        showToast('Đã tạo sự kiện.', 'success');
        navigate('/');
      } else {
        showToast(res?.error || 'Tạo sự kiện thất bại.', 'error');
      }
    } catch (err) {
      showToast(
        err?.response?.data?.error || err?.message || 'Lỗi khi tạo sự kiện.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 48, maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22 }}>Đăng nhập</h1>
        <p>Bạn cần đăng nhập tài khoản quản trị để dùng trang này.</p>
        <Link to="/">Về trang chủ</Link>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: 48, maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22 }}>Không có quyền</h1>
        <p>Chỉ tài khoản <strong>admin</strong> mới mở được form sự kiện.</p>
        <Link to="/">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        padding: '32px 16px 64px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <ToastBanner
        message={toast.message}
        type={toast.type}
        onDismiss={dismissToast}
      />

      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 26 }}>Tạo sự kiện (Admin)</h1>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
          Trợ lý AI gọi Gemini qua <code>POST /api/events/suggest</code>. Cần biến môi trường{' '}
          <code>GEMINI_API_KEY</code> trên server.{' '}
          <Link to="/manage/events" style={{ color: '#036280' }}>Trang này</Link>
        </p>

        <form onSubmit={handleSubmit}>
          {/* AI Assistant — phía trên cùng form */}
          <section
            style={{
              marginBottom: 28,
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>✨ AI Assistant</h2>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Ý tưởng sự kiện
            </label>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ví dụ: Ngày lễ tình nhân, Tết Trung Thu…"
              disabled={aiLoading}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 15,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={handleAISuggestion}
              disabled={aiLoading}
              style={{
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                background: aiLoading ? '#94a3b8' : '#036280',
                color: '#fff',
                fontWeight: 700,
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                fontSize: 15,
              }}
            >
              {aiLoading ? 'AI đang suy nghĩ…' : '✨ AI Gợi ý'}
            </button>
          </section>

          <label style={labelStyle}>Tên sự kiện *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Bắt đầu *</label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Kết thúc *</label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Kích hoạt sự kiện
          </label>

          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 15 }}>Giao diện (theme)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Màu chính</label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ ...inputStyle, height: 44, padding: 4 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Màu phụ</label>
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                style={{ ...inputStyle, height: 44, padding: 4 }}
              />
            </div>
          </div>

          <label style={labelStyle}>Hiệu ứng trang trí</label>
          <select
            value={decorationType}
            onChange={(e) => setDecorationType(e.target.value)}
            style={inputStyle}
          >
            <option value="none">none</option>
            <option value="snow">snow</option>
            <option value="firework">firework</option>
            <option value="hearts">hearts</option>
            <option value="confetti">confetti</option>
          </select>

          <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 15 }}>Giảm giá</h3>
          <label style={labelStyle}>% giảm (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={discountPercent}
            onChange={(e) =>
              setDiscountPercent(
                Math.min(100, Math.max(0, Number(e.target.value) || 0))
              )
            }
            style={inputStyle}
          />

          <label style={labelStyle}>Danh mục áp dụng (id, cách nhau bởi dấu phẩy)</label>
          <textarea
            value={targetCategoriesText}
            onChange={(e) => setTargetCategoriesText(e.target.value)}
            rows={3}
            placeholder="tieu-thuyet, truyen-tranh"
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <label style={labelStyle}>Slogan (gợi ý AI — không lưu vào DB nếu chưa có trường)</label>
          <textarea
            value={suggestedSlogan}
            onChange={(e) => setSuggestedSlogan(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '14px 24px',
                borderRadius: 10,
                border: 'none',
                background: submitting ? '#94a3b8' : '#036280',
                color: '#fff',
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Đang lưu…' : 'Lưu sự kiện'}
            </button>
            <Link to="/" style={{ alignSelf: 'center', color: '#036280' }}>
              Hủy — về trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  marginTop: 14,
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 15,
  boxSizing: 'border-box',
};

export default AdminEventForm;
