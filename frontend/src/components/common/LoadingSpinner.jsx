import React from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * Component hiển thị spinner loading với nhiều tùy chọn tùy chỉnh
 * 
 * @param {string} size - Kích thước spinner: 'small' | 'medium' | 'large' (default: 'medium')
 * @param {string} text - Text hiển thị bên dưới spinner (optional)
 * @param {boolean} fullScreen - Hiển thị full screen overlay (default: false)
 * @param {string} variant - Kiểu spinner: 'spinner' | 'dots' | 'pulse' | 'book' (default: 'spinner')
 * @param {string} className - CSS class bổ sung
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  text = null, 
  fullScreen = false,
  variant = 'spinner',
  className = ''
}) => {
  const { t } = useTranslation();

  // Default text nếu không có text được truyền vào
  const displayText = text || t('common.loading', 'Đang tải...');

  // Kích thước spinner
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  // Render spinner theo variant
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`loading-dots ${sizeClasses[size]}`}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`loading-pulse ${sizeClasses[size]}`}>
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
          </div>
        );
      
      case 'book':
        return (
          <div className={`loading-book ${sizeClasses[size]}`}>
            <div className="book">
              <div className="book-page"></div>
              <div className="book-page"></div>
              <div className="book-page"></div>
            </div>
          </div>
        );
      
      case 'spinner':
      default:
        return (
          <div className={`loading-spinner ${sizeClasses[size]}`}>
            <div className="spinner-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        );
    }
  };

  const content = (
    <div className={`loading-spinner-wrapper ${className}`}>
      {renderSpinner()}
      {displayText && (
        <p className="loading-text">{displayText}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

