import React from 'react';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';

const ProductList = ({ products, loading, error, columns = 3 }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner size="large" variant="spinner" text="Đang tải..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-5">
        <p>Không có sản phẩm nào.</p>
      </div>
    );
  }

  // Determine column class based on columns prop
  const getColumnClass = () => {
    switch(columns) {
      case 4:
        return 'col-xl-3 col-lg-4 col-md-6';
      case 3:
        return 'col-xl-4 col-lg-4 col-md-6';
      case 2:
        return 'col-xl-6 col-lg-6 col-md-6';
      default:
        return 'col-xl-4 col-lg-4 col-md-6';
    }
  };

  return (
    <div className="row">
      {products.map((product) => (
        <div key={product._id || product.slug} className={getColumnClass()}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
};

export default ProductList;

