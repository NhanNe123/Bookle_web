import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { getProductImage } from '../utils/categoryUtils';

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  const handleRemoveItem = (productId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?')) {
      removeFromWishlist(productId);
    }
  };

  const handleClearWishlist = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?')) {
      clearWishlist();
    }
  };

  const handleAddAllToCart = () => {
    wishlist.forEach(product => {
      if (product.isAvailable && product.stock > 0) {
        addToCart(product, 1);
      }
    });
    alert('Đã thêm tất cả sản phẩm có sẵn vào giỏ hàng!');
  };

  if (wishlist.length === 0) {
    return (
      <>
        {/* Breadcrumb */}
        <div className="breadcrumb-wrapper">
          <div className="container">
            <div className="page-heading">
              <h1>Danh sách yêu thích</h1>
              <div className="page-header">
                <ul className="breadcrumb-items">
                  <li><Link to="/">Trang chủ</Link></li>
                  <li><i className="fa-solid fa-chevron-right"></i></li>
                  <li>Yêu thích</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Wishlist */}
        <section className="wishlist-section section-padding">
          <div className="container">
            <div className="text-center py-5">
              <i className="fa-regular fa-heart fa-4x text-muted mb-3"></i>
              <h3>Danh sách yêu thích trống</h3>
              <p className="text-muted mb-4">Bạn chưa có sản phẩm nào trong danh sách yêu thích</p>
              <Link to="/shop" className="theme-btn">
                <i className="fa-solid fa-arrow-left"></i> Khám phá sản phẩm
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-wrapper">
        <div className="container">
          <div className="page-heading">
            <h1>Danh sách yêu thích</h1>
            <div className="page-header">
              <ul className="breadcrumb-items">
                <li><Link to="/">Trang chủ</Link></li>
                <li><i className="fa-solid fa-chevron-right"></i></li>
                <li>Yêu thích</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Section */}
      <section className="wishlist-section section-padding">
        <div className="container">
          <div className="wishlist-wrapper">
            <div className="row">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>
                    <i className="fa-solid fa-heart text-danger me-2"></i>
                    {wishlist.length} sản phẩm yêu thích
                  </h4>
                  <div className="d-flex gap-2">
                    <button className="theme-btn style-2" onClick={handleAddAllToCart}>
                      <i className="fa-solid fa-cart-plus"></i> Thêm tất cả vào giỏ
                    </button>
                    <button className="theme-btn bg-danger" onClick={handleClearWishlist}>
                      <i className="fa-solid fa-trash"></i> Xóa tất cả
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Giá</th>
                        <th>Tình trạng</th>
                        <th>Thao tác</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlist.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="cart-product-items d-flex align-items-center">
                              <div className="product-image">
                                <Link to={`/shop-details/${item.slug || item._id}`} className="d-inline-block">
                                  <div className="cart-thumb-frame">
                                    <img
                                      src={getProductImage(item.images, item.coverImage)}
                                      alt={item.name}
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  </div>
                                </Link>
                              </div>
                              <div className="product-content ms-3">
                                <h5>
                                  <Link to={`/shop-details/${item.slug || item._id}`}>
                                    {item.name}
                                  </Link>
                                </h5>
                                {item.author && (
                                  <p className="text-muted mb-0 small">Tác giả: {item.author}</p>
                                )}
                                {item.categories && item.categories.length > 0 && (
                                  <p className="text-muted mb-0 small">
                                    <i className="fa-solid fa-tag"></i> {item.categories.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <h6 className="mb-0">{formatPrice(item.price)}</h6>
                            {item.compareAtPrice && item.compareAtPrice > item.price && (
                              <del className="text-muted small">{formatPrice(item.compareAtPrice)}</del>
                            )}
                          </td>
                          <td>
                            {item.isAvailable && item.stock > 0 ? (
                              <span className="badge bg-success">Còn hàng</span>
                            ) : (
                              <span className="badge bg-danger">Hết hàng</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="theme-btn"
                              onClick={() => handleAddToCart(item)}
                              disabled={!item.isAvailable || item.stock <= 0}
                            >
                              <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ
                            </button>
                          </td>
                          <td>
                            <button 
                              className="remove-icon"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 d-flex justify-content-between align-items-center">
                  <Link to="/shop" className="theme-btn">
                    <i className="fa-solid fa-arrow-left"></i> Tiếp tục mua sắm
                  </Link>
                  <div className="text-muted">
                    <i className="fa-solid fa-circle-info"></i> 
                    Sản phẩm yêu thích được lưu trữ cục bộ trên trình duyệt
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WishlistPage;
