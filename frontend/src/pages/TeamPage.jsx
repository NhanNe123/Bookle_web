import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAuthors } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TeamPage = () => {
  const { t, i18n } = useTranslation();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, vietnamese, international

  const isVietnamese = i18n.language === 'vi';

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAuthors({ search: searchTerm });
        let authorsList = Array.isArray(data) ? data : (data.items || []);
        
        // Filter by type
        if (filterType === 'vietnamese') {
          authorsList = authorsList.filter(a => {
            const name = a.name.toLowerCase();
            return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/.test(name) ||
                   name.startsWith('nguyễn') || name.startsWith('trần') || name.startsWith('lê') ||
                   name.startsWith('phạm') || name.startsWith('hoàng') || name.startsWith('vũ');
          });
        } else if (filterType === 'international') {
          authorsList = authorsList.filter(a => {
            const name = a.name.toLowerCase();
            return !/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/.test(name);
          });
        }
        
        setAuthors(authorsList);
      } catch (err) {
        console.error('Error fetching authors:', err);
        setError(isVietnamese ? 'Không thể tải danh sách tác giả' : 'Failed to load authors');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, [searchTerm, filterType, isVietnamese]);

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
            <h1>{isVietnamese ? 'Tác Giả' : 'Authors'}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{isVietnamese ? 'Trang chủ' : 'Home'}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{isVietnamese ? 'Tác Giả' : 'Authors'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Authors Section */}
      <section className="team-section fix section-padding">
        <div className="container">
          {/* Section Title */}
          <div className="row">
            <div className="col-12">
              <div className="section-title text-center mb-4">
                <h2>{isVietnamese ? 'Khám Phá Tác Giả' : 'Discover Authors'}</h2>
                <p>{isVietnamese ? 'Những cây bút tài năng với nhiều tác phẩm hay' : 'Talented writers with many great works'}</p>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="row mb-4">
            <div className="col-lg-6 mx-auto">
              <div className="search-box mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fa-solid fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder={isVietnamese ? 'Tìm kiếm tác giả...' : 'Search authors...'}
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <button 
                  className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterType('all')}
                  style={filterType === 'all' ? { background: '#036280', borderColor: '#036280' } : {}}
                >
                  {isVietnamese ? 'Tất cả' : 'All'}
                </button>
                <button 
                  className={`btn btn-sm ${filterType === 'vietnamese' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterType('vietnamese')}
                  style={filterType === 'vietnamese' ? { background: '#036280', borderColor: '#036280' } : {}}
                >
                  🇻🇳 {isVietnamese ? 'Việt Nam' : 'Vietnamese'}
                </button>
                <button 
                  className={`btn btn-sm ${filterType === 'international' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterType('international')}
                  style={filterType === 'international' ? { background: '#036280', borderColor: '#036280' } : {}}
                >
                  🌍 {isVietnamese ? 'Quốc tế' : 'International'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          {!loading && authors.length > 0 && (
            <div className="text-center mb-4">
              <span className="badge bg-light text-dark px-3 py-2" style={{ fontSize: '14px' }}>
                <i className="fa-solid fa-feather-pointed me-2" style={{ color: '#036280' }}></i>
                {authors.length} {isVietnamese ? 'tác giả' : 'authors'}
              </span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-5">
              <LoadingSpinner size="large" variant="spinner" text={isVietnamese ? 'Đang tải...' : 'Loading...'} />
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
                <div className="row g-4">
                  {authors.map((author) => (
                    <div key={author._id || author.id} className="col-xl-3 col-lg-4 col-md-6">
                      <Link 
                        to={`/author/${author.slug || author._id || author.id}`}
                        style={{ textDecoration: 'none', display: 'block' }}
                      >
                        <div className="team-box-items" style={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}>
                          <div className="team-image">
                            <div className="thumb">
                              <img
                                src={author.avatar || author.image || '/assets/img/about.jpg'}
                                alt={author.name}
                                style={{ objectFit: 'cover' }}
                                onError={(e) => {
                                  if (e.target.src !== '/assets/img/about.jpg') {
                                    e.target.src = '/assets/img/about.jpg';
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
                            <h6 style={{ color: '#1a1a2e', fontWeight: '600' }}>
                              {author.name}
                            </h6>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                              {author.bookCount !== undefined 
                                ? `${author.bookCount} ${isVietnamese ? 'tác phẩm' : 'books'}`
                                : author.title || (isVietnamese ? 'Tác giả' : 'Author')
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
                  <i className="fa-solid fa-user-pen" style={{ fontSize: '64px', color: '#ddd', marginBottom: '20px', display: 'block' }}></i>
                  <h4>{isVietnamese ? 'Không tìm thấy tác giả nào' : 'No authors found'}</h4>
                  <p className="text-muted">{isVietnamese ? 'Thử tìm kiếm với từ khóa khác' : 'Try searching with different keywords'}</p>
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
