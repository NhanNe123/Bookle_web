import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPosts } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BlogPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Blog');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = { category: selectedCategory };
        const data = await getPosts(params);
        setPosts(Array.isArray(data) ? data : (data.items || []));
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Không thể tải danh sách bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <h1>{t('blog.title')}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{t('blog.title')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <section className="news-section fix section-padding section-bg">
        <div className="container">
          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              {/* Section Title */}
              <div className="section-title mb-5">
                <h2 className="mb-3">{t('blog.sectionTitle')}</h2>
                <p>{t('blog.sectionSubtitle')}</p>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-5">
                  <LoadingSpinner size="large" variant="spinner" text={t('common.loading')} />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="alert alert-danger text-center" role="alert">
                  {error}
                </div>
              )}

              {/* Posts List */}
              {!loading && !error && (
                <>
                  {posts.length > 0 ? (
                    <div className="news-standard-wrapper">
                      {posts.map((post) => (
                        <div key={post._id || post.id} className="news-standard-items" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <div className="news-thumb" style={{ height: '300px', overflow: 'hidden', flexShrink: 0 }}>
                            <Link to={`/news-details/${post.slug || post._id || post.id}`} style={{ display: 'block', height: '100%' }}>
                              <img
                                src={post.featuredImage || '/assets/img/book/01.png'}
                                alt={post.title}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  // Prevent infinite loop - only set fallback once
                                  const target = e.target;
                                  const fallbackImage = '/assets/img/book/01.png';
                                  if (!target.dataset.fallbackSet) {
                                    target.dataset.fallbackSet = 'true';
                                    const currentSrc = target.src || target.getAttribute('src') || '';
                                    const fallbackFullPath = `${window.location.origin}${fallbackImage}`;
                                    
                                    // Only set fallback if current src is not already the fallback
                                    if (!currentSrc.includes(fallbackImage) && currentSrc !== fallbackFullPath) {
                                      target.src = fallbackImage;
                                    } else {
                                      // If already fallback, hide the image to prevent further requests
                                      target.style.display = 'none';
                                    }
                                  } else {
                                    // If fallback also fails, hide the image
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            </Link>
                            <div className="post">
                              {post.category || 'Blog'}
                            </div>
                          </div>
                          <div className="news-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <ul>
                              <li>
                                <i className="fa-light fa-calendar-days"></i>
                                {formatDate(post.publishedAt || post.createdAt)}
                              </li>
                              <li>
                                <i className="fa-regular fa-user"></i>
                                {t('blog.by')} {post.author || 'Admin'}
                              </li>
                              <li>
                                <i className="fa-regular fa-eye"></i>
                                {post.views || 0} {t('blog.views')}
                              </li>
                            </ul>
                            <h3>
                              <Link to={`/news-details/${post.slug || post._id || post.id}`}>
                                {post.title}
                              </Link>
                            </h3>
                            {post.excerpt && (
                              <p style={{ color: '#6f7480', lineHeight: '1.8', marginBottom: '20px', flex: 1 }}>
                                {post.excerpt}
                              </p>
                            )}
                            <div style={{ marginTop: 'auto' }}>
                              <Link to={`/news-details/${post.slug || post._id || post.id}`} className="theme-btn-2">
                                {t('blog.readMore')} <i className="fa-regular fa-arrow-right-long"></i>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fa-solid fa-newspaper" style={{ fontSize: '64px', color: '#ccc', marginBottom: '20px' }}></i>
                      <h4>{t('blog.noPosts')}</h4>
                      <p className="text-muted">{t('blog.noPostsDescription')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="main-sidebar">
                {/* Search Widget */}
                <div className="single-sidebar-widget search-widget">
                  <div className="wid-title">
                    <h3>{t('blog.search')}</h3>
                  </div>
                  <form>
                    <input type="text" placeholder={t('blog.searchPlaceholder')} />
                    <button type="submit">
                      <i className="far fa-search"></i>
                    </button>
                  </form>
                </div>

                {/* Category Widget */}
                <div className="single-sidebar-widget">
                  <div className="wid-title">
                    <h3>{t('blog.categories')}</h3>
                  </div>
                  <ul className="list-area">
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); setSelectedCategory('Blog'); }}>
                        <i className="fa-solid fa-chevrons-right"></i>
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); setSelectedCategory('News'); }}>
                        <i className="fa-solid fa-chevrons-right"></i>
                        News
                      </a>
                    </li>
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); setSelectedCategory('Activities'); }}>
                        <i className="fa-solid fa-chevrons-right"></i>
                        Activities
                      </a>
                    </li>
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); setSelectedCategory('Events'); }}>
                        <i className="fa-solid fa-chevrons-right"></i>
                        Events
                      </a>
                    </li>
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); setSelectedCategory('Announcements'); }}>
                        <i className="fa-solid fa-chevrons-right"></i>
                        Announcements
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Recent Posts Widget */}
                {posts.length > 0 && (
                  <div className="single-sidebar-widget">
                    <div className="wid-title">
                      <h3>{t('blog.recentPosts')}</h3>
                    </div>
                    <ul className="list-area">
                      {posts.slice(0, 5).map((post) => (
                        <li key={post._id || post.id}>
                          <Link to={`/news-details/${post.slug || post._id || post.id}`}>
                            <i className="fa-solid fa-chevrons-right"></i>
                            {post.title.length > 50 ? `${post.title.substring(0, 50)}...` : post.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;

