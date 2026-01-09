import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo || null
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '50px', 
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#dc3545' }}>Đã xảy ra lỗi!</h1>
          <p>Ứng dụng gặp sự cố. Vui lòng làm mới trang.</p>
          <details style={{ 
            marginTop: '20px', 
            textAlign: 'left',
            maxWidth: '800px',
            margin: '20px auto',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Chi tiết lỗi (click để xem)
            </summary>
            <pre style={{ 
              marginTop: '10px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
              {this.state.error && this.state.error.stack && (
                <>
                  <br />
                  <strong>Stack trace:</strong>
                  <br />
                  {this.state.error.stack}
                </>
              )}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Làm mới trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

