import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAuthorById, getAuthorBySlug, getAuthorProducts } from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TeamDetailsPage = () => {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch by slug first, then by ID
        let authorData;
        try {
          authorData = await getAuthorBySlug(id);
        } catch (err) {
          console.log('Try by slug failed, trying by ID:', err);
          authorData = await getAuthorById(id);
        }
        
        // Handle response format - API returns direct object or { item: ... }
        if (authorData && authorData.item) {
          authorData = authorData.item;
        }
        
        // Check if authorData is valid
        if (!authorData || (!authorData._id && !authorData.id && !authorData.name)) {
          throw new Error('Author data is invalid');
        }
        
        setAuthor(authorData);
        
        // Fetch author's products using author name or ID
        const authorId = authorData._id || authorData.id || id;
        const authorName = authorData.name;
        
        if (authorId || authorName) {
          try {
            const productsData = await getAuthorProducts(authorId || authorName);
            setProducts(Array.isArray(productsData) ? productsData : (productsData.items || []));
          } catch (err) {
            console.error('Error fetching author products:', err);
            setProducts([]);
          }
        }
      } catch (err) {
        console.error('Error fetching author:', err);
        setError('Không thể tải thông tin tác giả');
        setAuthor(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuthorData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner fullScreen={true} size="large" variant="spinner" text="Đang tải..." />
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center" role="alert">
          {error || 'Không tìm thấy tác giả'}
        </div>
        <div className="text-center mt-3">
          <Link to="/team" className="theme-btn">
            Quay lại danh sách tác giả
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb Section */}
      <div className="breadcrumb-wrapper">
        <div className="book1">
          <img src="/assets/img/hero/book1.png" alt="book" />
        </div>
        <div className="book2">
          <img src="/assets/img/hero/book2.png" alt="book" />
        </div>
        <div className="container">
          <div className="page-heading">
            <h1>{author.name}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>
                  <Link to="/team">Author</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{author.name}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Team Details Section */}
      <section className="team-details-section fix section-padding">
        <div className="container">
          {/* Author Info Card */}
          <div className="team-details-wrapper">
            <div className="team-details-items">
              <div className="details-image">
                <img
                  src={author.avatar || author.image || '/assets/img/about.jpg'}
                  alt={author.name}
                  onError={(e) => {
                    // Tránh vòng lặp vô hạn
                    if (e.target.src !== '/assets/img/about.jpg') {
                      e.target.src = '/assets/img/about.jpg';
                    } else {
                      // Nếu placeholder cũng lỗi, ẩn ảnh
                      e.target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <div className="details-content">
                <h3>{author.name}</h3>
                {author.title && <span>{author.title}</span>}
                
                {author.social && (author.social.facebook || author.social.twitter || author.social.instagram || author.social.linkedin) && (
                  <div className="social-icon d-flex">
                    {author.social.facebook && (
                      <a href={author.social.facebook} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-facebook-f"></i>
                      </a>
                    )}
                    {author.social.twitter && (
                      <a href={author.social.twitter} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-twitter"></i>
                      </a>
                    )}
                    {author.social.instagram && (
                      <a href={author.social.instagram} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                    {author.social.linkedin && (
                      <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-linkedin-in"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {author.bio && (
              <p>{author.bio}</p>
            )}
            
            <div className="details-counter-area">
              <div className="counter-items">
                <h2>{products.length}</h2>
                <p>Published Books</p>
              </div>
              {author.awards && author.awards.length > 0 && (
                <div className="counter-items">
                  <h2>{author.awards.length}</h2>
                  <p>Awards</p>
                </div>
              )}
            </div>
          </div>

          {/* Author Bio & Awards */}
          {(author.bio || (author.awards && author.awards.length > 0)) && (
            <div className="row mt-5">
              <div className="col-lg-12">
                {author.bio && (
                  <div className="testimonial-card-items mb-4">
                    <h3 className="mb-3">About Author</h3>
                    <div className="bio-content">
                      {author.bio.split('\n').map((paragraph, index) => (
                        <p key={index} style={{ marginBottom: '15px' }}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {author.awards && author.awards.length > 0 && (
                  <div className="testimonial-card-items">
                    <h3 className="mb-3">Awards & Achievements</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {author.awards.map((award, index) => (
                        <li key={index} style={{ padding: '10px 0', borderBottom: index < author.awards.length - 1 ? '1px solid #E5E5E5' : 'none' }}>
                          <i className="fa-solid fa-trophy me-2" style={{ color: '#ffb800' }}></i>
                          {award}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Author's Books */}
          {products.length > 0 && (
            <div className="row mt-5">
              <div className="col-12">
                <div className="section-title text-center mb-5">
                  <h2>Published Books</h2>
                  <p>Books written by {author.name}</p>
                </div>
                <div className="row g-4">
                  {products.map((product) => (
                    <div key={product._id || product.id} className="col-xl-3 col-lg-4 col-md-6">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {products.length === 0 && (
            <div className="row mt-5">
              <div className="col-12">
                <div className="testimonial-card-items text-center">
                  <i className="fa-solid fa-book-open" style={{ fontSize: '64px', color: '#ccc', marginBottom: '20px' }}></i>
                  <h4>No Books Available</h4>
                  <p className="text-muted">This author hasn't published any books yet.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default TeamDetailsPage;
