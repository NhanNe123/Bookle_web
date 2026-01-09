import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPostById, getPostBySlug, getPosts } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NewsDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPostData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch by slug first, then by ID
        let postData;
        try {
          postData = await getPostBySlug(id);
        } catch (err) {
          console.log('Try by slug failed, trying by ID:', err);
          postData = await getPostById(id);
        }

        // Handle response format - API returns direct object or { item: ... }
        if (postData && postData.item) {
          postData = postData.item;
        }

        // Check if postData is valid
        if (!postData || (!postData._id && !postData.id && !postData.title)) {
          throw new Error('Post data is invalid');
        }

        if (isMounted) {
          setPost(postData);

          // Fetch related posts (same category, excluding current post)
          try {
            const relatedParams = {
              category: postData.category,
              limit: 4
            };
            const relatedData = await getPosts(relatedParams);
            const relatedItems = Array.isArray(relatedData) 
              ? relatedData 
              : (relatedData.items || []);
            
            // Filter out current post
            const filteredRelated = relatedItems.filter(
              (p) => (p._id || p.id) !== (postData._id || postData.id)
            ).slice(0, 3);
            
            if (isMounted) {
              setRelatedPosts(filteredRelated);
            }
          } catch (err) {
            console.error('Error fetching related posts:', err);
            if (isMounted) {
              setRelatedPosts([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        if (isMounted) {
          setError('Không thể tải bài viết');
          setPost(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchPostData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadingTime = (content) => {
    if (!content) return 1;
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/min
    return readingTime;
  };

  const handleShare = (platform) => {
    if (!post) return;
    
    const url = window.location.href;
    const title = post.title;
    const text = post.excerpt || '';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="text-center py-5" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner fullScreen={true} size="large" variant="spinner" text={t('common.loading')} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center" role="alert" style={{ borderRadius: '12px', padding: '2rem' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
          <h4>{error || t('news.details.notFound')}</h4>
        </div>
        <div className="text-center mt-4">
          <Link to="/news" className="theme-btn" style={{ padding: '12px 30px', borderRadius: '8px' }}>
            <i className="fa-regular fa-arrow-left me-2"></i>
            {t('news.details.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const fallbackImage = '/assets/img/book/01.png';
  const imageSrc = post.featuredImage || fallbackImage;
  const readingTime = calculateReadingTime(post.content);

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
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{t('header.menu.home')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>
                  <Link to="/news">{t('news.title')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* News Details Section */}
      <section className="news-details-area fix section-padding" style={{ background: '#f8f9fa' }}>
        <div className="container">
          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              <article className="blog-post-details" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
                <div className="single-blog-post">
                  {/* Category Badge */}
                  {post.category && (
                    <div style={{ padding: '20px 30px 0', position: 'relative', zIndex: 2 }}>
                      <span 
                        className="badge" 
                        style={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          padding: '8px 20px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {post.category}
                      </span>
                    </div>
                  )}

                  {/* Featured Image */}
                  <div className="post-featured-thumb" style={{ marginTop: post.category ? '0' : '0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#f0f0f0' }}>
                      <img
                        src={imageSrc}
                        alt={post.title}
                        loading="lazy"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onError={(e) => {
                          const target = e.target;
                          if (!target.dataset.fallbackSet) {
                            target.dataset.fallbackSet = 'true';
                            const currentSrc = target.src || target.getAttribute('src') || '';
                            const fallbackFullPath = `${window.location.origin}${fallbackImage}`;
                            
                            if (!currentSrc.includes(fallbackImage) && currentSrc !== fallbackFullPath) {
                              target.src = fallbackImage;
                            } else {
                              target.style.display = 'none';
                            }
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                        }}
                      />
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="post-content" style={{ padding: '40px 30px' }}>
                    {/* Post Title */}
                    <h1 style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: '700', 
                      lineHeight: '1.2', 
                      marginBottom: '20px',
                      color: '#1a1a1a'
                    }}>
                      {post.title}
                    </h1>

                    {/* Post Meta */}
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '20px', 
                      alignItems: 'center',
                      paddingBottom: '25px',
                      marginBottom: '25px',
                      borderBottom: '2px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                        <i className="fa-light fa-calendar-days" style={{ color: '#667eea' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                        <i className="fa-regular fa-user" style={{ color: '#667eea' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          {t('news.by')} <strong style={{ color: '#1a1a1a' }}>{post.author || 'Admin'}</strong>
                        </span>
                      </div>
                      {post.views !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                          <i className="fa-regular fa-eye" style={{ color: '#667eea' }}></i>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>
                            {post.views || 0} {t('news.views') || 'views'}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                        <i className="fa-regular fa-clock" style={{ color: '#667eea' }}></i>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          {readingTime} {readingTime === 1 ? 'phút' : 'phút'} đọc
                        </span>
                      </div>
                    </div>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        padding: '25px',
                        borderRadius: '12px',
                        marginBottom: '30px',
                        borderLeft: '4px solid #667eea'
                      }}>
                        <p style={{ 
                          fontSize: '1.1rem', 
                          lineHeight: '1.8', 
                          color: '#333',
                          margin: 0,
                          fontStyle: 'italic',
                          fontWeight: '500'
                        }}>
                          {post.excerpt}
                        </p>
                      </div>
                    )}

                    {/* Post Content */}
                    {post.content && (
                      <div 
                        className="details-content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        style={{
                          fontSize: '1.05rem',
                          lineHeight: '1.9',
                          color: '#444',
                          marginBottom: '40px'
                        }}
                      />
                    )}

                    {/* Tags and Share */}
                    <div style={{ 
                      paddingTop: '30px',
                      borderTop: '2px solid #f0f0f0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '30px',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      {post.tags && post.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#666', marginRight: '5px' }}>
                            {t('news.details.tags') || 'Tags'}:
                          </span>
                          {post.tags.map((tag, index) => (
                            <Link
                              key={index}
                              to={`/news?tag=${tag}`}
                              style={{
                                background: '#f0f0f0',
                                color: '#667eea',
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                border: '1px solid transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#667eea';
                                e.target.style.color = '#fff';
                                e.target.style.borderColor = '#667eea';
                                e.target.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#f0f0f0';
                                e.target.style.color = '#667eea';
                                e.target.style.borderColor = 'transparent';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: '600', color: '#666', fontSize: '14px' }}>
                          {t('news.details.share')}:
                        </span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare('facebook');
                            }}
                            title="Facebook"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#1877f2',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              transition: 'all 0.3s ease',
                              fontSize: '16px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                              e.target.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <i className="fab fa-facebook-f"></i>
                          </a>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare('twitter');
                            }}
                            title="Twitter"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#1da1f2',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              transition: 'all 0.3s ease',
                              fontSize: '16px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                              e.target.style.boxShadow = '0 4px 12px rgba(29, 161, 242, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <i className="fab fa-twitter"></i>
                          </a>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare('linkedin');
                            }}
                            title="LinkedIn"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#0077b5',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              transition: 'all 0.3s ease',
                              fontSize: '16px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.1)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0, 119, 181, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <i className="fab fa-linkedin-in"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="main-sidebar" style={{ position: 'sticky', top: '100px' }}>
                {/* Back to List */}
                <div className="single-sidebar-widget mb-4" style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <Link 
                    to="/news" 
                    className="theme-btn w-100 text-center"
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="fa-regular fa-arrow-left"></i>
                    {t('news.details.backToList')}
                  </Link>
                </div>

                {/* Related Posts Widget */}
                {relatedPosts.length > 0 && (
                  <div className="single-sidebar-widget" style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="wid-title">
                      <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '20px', color: '#1a1a1a' }}>
                        {t('news.details.relatedPosts')}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {relatedPosts.map((relatedPost) => {
                        const relatedImageSrc = relatedPost.featuredImage || '/assets/img/book/01.png';
                        return (
                          <Link
                            key={relatedPost._id || relatedPost.id}
                            to={`/news-details/${relatedPost.slug || relatedPost._id || relatedPost.id}`}
                            style={{
                              display: 'flex',
                              gap: '15px',
                              textDecoration: 'none',
                              transition: 'all 0.3s ease',
                              padding: '10px',
                              borderRadius: '8px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'translateX(5px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <div style={{ 
                              width: '80px', 
                              height: '80px', 
                              borderRadius: '8px', 
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: '#f0f0f0'
                            }}>
                              <img
                                src={relatedImageSrc}
                                alt={relatedPost.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                lineHeight: '1.4',
                                color: '#1a1a1a',
                                margin: 0,
                                marginBottom: '5px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {relatedPost.title}
                              </h4>
                              <div style={{ fontSize: '12px', color: '#999' }}>
                                {formatDate(relatedPost.publishedAt || relatedPost.createdAt)}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
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

export default NewsDetailsPage;
