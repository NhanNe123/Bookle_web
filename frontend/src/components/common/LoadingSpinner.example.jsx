/**
 * LoadingSpinner Component - Ví dụ sử dụng
 * 
 * Component này hỗ trợ lazy loading với nhiều tùy chọn tùy chỉnh
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

// ============================================
// Ví dụ 1: Sử dụng với Suspense (Lazy Loading)
// ============================================
import { Suspense, lazy } from 'react';

const LazyComponent = lazy(() => import('./SomeComponent'));

function AppWithSuspense() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen={true} variant="spinner" size="large" />}>
      <LazyComponent />
    </Suspense>
  );
}

// ============================================
// Ví dụ 2: Loading trong component (không full screen)
// ============================================
function ComponentWithLoading() {
  const [loading, setLoading] = React.useState(true);

  if (loading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner size="medium" variant="spinner" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  return <div>Nội dung đã tải xong</div>;
}

// ============================================
// Ví dụ 3: Các variant khác nhau
// ============================================
function VariantExamples() {
  return (
    <div>
      {/* Spinner variant (mặc định) */}
      <LoadingSpinner variant="spinner" size="medium" />
      
      {/* Dots variant */}
      <LoadingSpinner variant="dots" size="medium" text="Đang xử lý..." />
      
      {/* Pulse variant */}
      <LoadingSpinner variant="pulse" size="large" />
      
      {/* Book variant (phù hợp với theme sách) */}
      <LoadingSpinner variant="book" size="medium" text="Đang tải sách..." />
    </div>
  );
}

// ============================================
// Ví dụ 4: Các kích thước
// ============================================
function SizeExamples() {
  return (
    <div>
      <LoadingSpinner size="small" variant="spinner" />
      <LoadingSpinner size="medium" variant="spinner" />
      <LoadingSpinner size="large" variant="spinner" />
    </div>
  );
}

// ============================================
// Ví dụ 5: Full screen overlay
// ============================================
function FullScreenExample() {
  const [loading, setLoading] = React.useState(true);

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        variant="spinner" 
        size="large" 
        text="Đang tải trang..." 
      />
    );
  }

  return <div>Nội dung trang</div>;
}

// ============================================
// Ví dụ 6: Sử dụng trong button/action
// ============================================
function ButtonWithLoading() {
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitting(false);
  };

  return (
    <button onClick={handleSubmit} disabled={submitting}>
      {submitting ? (
        <>
          <LoadingSpinner size="small" variant="dots" />
          <span>Đang gửi...</span>
        </>
      ) : (
        'Gửi'
      )}
    </button>
  );
}

export default {
  AppWithSuspense,
  ComponentWithLoading,
  VariantExamples,
  SizeExamples,
  FullScreenExample,
  ButtonWithLoading
};

