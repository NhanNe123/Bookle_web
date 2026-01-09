import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAuthors } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TeamPage = () => {
  const { t } = useTranslation();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAuthors({ search: searchTerm });
        setAuthors(Array.isArray(data) ? data : (data.items || []));
      } catch (err) {
        console.error('Error fetching authors:', err);
        setError('Không thể tải danh sách tác giả');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
            <h1>Author</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>Author</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <section className="team-section fix section-padding">
        <div className="container">
          {/* Section Title */}
          <div className="row">
            <div className="col-12">
              <div className="section-title text-center mb-5">
                <h2>{t('team.sectionTitle')}</h2>
                <p>{t('team.sectionSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="row mb-5">
            <div className="col-lg-6 mx-auto">
              <div className="search-box">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm tác giả..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <LoadingSpinner size="large" variant="spinner" text={t('common.loading', 'Đang tải...')} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}

          {/* Authors Grid */}
          {!loading && !error && (
            <>
              {authors.length > 0 ? (
                <div className="row">
                  {authors.map((author) => (
                    <div key={author._id || author.id} className="col-xl-3 col-lg-4 col-md-6">
                      <Link 
                        to={`/team-details/${author.slug || author._id || author.id}`}
                        style={{ textDecoration: 'none', display: 'block' }}
                      >
                        <div className="team-box-items" style={{ cursor: 'pointer' }}>
                          <div className="team-image">
                            <div className="thumb">
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
                            <div className="shape-img">
                              <img 
                                src="/assets/img/circle-shape.png" 
                                alt="shape"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                          <div className="team-content text-center">
                            <h6>
                              {author.name}
                            </h6>
                            <p>
                              {author.bookCount !== undefined 
                                ? `${author.bookCount} Published Books`
                                : author.title || 'Author'
                              }
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fa-solid fa-user-slash" style={{ fontSize: '64px', color: '#ccc', marginBottom: '20px' }}></i>
                  <h4>Không tìm thấy tác giả nào</h4>
                  <p className="text-muted">Thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default TeamPage;
