import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPosts } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FALLBACK_IMAGE = '/assets/img/news/placeholder.jpg';
const DEFAULT_CATEGORY = 'Activities';

const NewsPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPosts();

        if (!isMounted) return;

        if (Array.isArray(data)) {
          setPosts(data);
        } else if (data?.items && Array.isArray(data.items)) {
          setPosts(data.items);
        } else if (data?.success && data?.items) {
          setPosts(data.items);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        if (isMounted) {
          setError(t('news.fetchError', { defaultValue: 'Không thể tải danh sách bài viết' }));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImageSrc = (post) => post?.featuredImage || post?.images?.[0] || FALLBACK_IMAGE;

  const renderPostCard = (post, index) => {
    const delay = ((index % 4) * 0.2).toFixed(1);
    const imageSrc = getImageSrc(post);
    const postSlug = post?.slug || post?._id || post?.id || '';
    const category = post?.category || DEFAULT_CATEGORY;

    const handleImageError = (event) => {
      const target = event.currentTarget;
      if (target.dataset.fallbackApplied) {
        target.style.display = 'none';
        return;
      }

      target.dataset.fallbackApplied = 'true';
      target.src = FALLBACK_IMAGE;
    };

    return (
      <div
        key={postSlug || `${post.title}-${index}`}
        className="col-xl-3 col-lg-4 col-md-6 wow fadeInUp"
        data-wow-delay={`${delay}s`}
      >
        <div className="news-card-items style-2 mt-0">
          <div className="news-image">
            <img
              src={imageSrc}
              alt={post?.title || 'news'}
              loading="lazy"
              onError={handleImageError}
            />
            <img
              src={imageSrc}
              alt={post?.title || 'news'}
              loading="lazy"
              onError={handleImageError}
            />
            <div className="post-box">{category}</div>
          </div>
          <div className="news-content">
            <ul>
              <li>
                <i className="fa-light fa-calendar-days" />
                {formatDate(post?.publishedAt || post?.createdAt) || t('news.unknownDate', { defaultValue: 'N/A' })}
              </li>
              <li>
                <i className="fa-regular fa-user" />
                {t('news.by')} {post?.author || 'Admin'}
              </li>
            </ul>
            <h3>
              <Link to={`/news-details/${postSlug}`}>
                {post?.title || t('news.untitledPost', { defaultValue: 'Bài viết chưa có tiêu đề' })}
              </Link>
            </h3>
            {post?.excerpt && (
              <p className="mb-3" style={{ color: '#6f7480', fontSize: '14px' }}>
                {post.excerpt.length > 110 ? `${post.excerpt.slice(0, 107)}...` : post.excerpt}
              </p>
            )}
            <Link to={`/news-details/${postSlug}`} className="theme-btn-2">
              {t('news.readMore')} <i className="fa-regular fa-arrow-right-long" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="breadcrumb-wrapper">
        <div className="book1">
          <img src="/assets/img/hero/book1.png" alt="book" />
        </div>
        <div className="book2">
          <img src="/assets/img/hero/book2.png" alt="book" />
        </div>
        <div className="container">
          <div className="page-heading">
            <h1>{t('news.title')}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items wow fadeInUp" data-wow-delay=".3s">
                <li>
                  <Link to="/">{t('header.menu.home')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right" />
                </li>
                <li>{t('news.title')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="news-section fix section-padding">
        <div className="container">
          <div className="section-title text-center mb-5">
            <p className="subtitle wow fadeInUp" data-wow-delay=".1s">
              {t('news.sectionSubtitle')}
            </p>
            <h2 className="wow fadeInUp" data-wow-delay=".2s">
              {t('news.sectionTitle')}
            </h2>
          </div>

          {loading && (
            <div className="text-center py-5">
              <LoadingSpinner size="large" variant="spinner" text={t('common.loading')} />
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {posts.length > 0 ? (
                <div className="row g-4">
                  {posts.map((post, index) => renderPostCard(post, index))}
                </div>
              ) : (
                <div className="empty-news text-center py-5">
                  <i className="fa-solid fa-newspaper" />
                  <h4 className="mt-3">{t('news.noPosts')}</h4>
                  <p className="text-muted">{t('news.noPostsDescription')}</p>
                </div>
              )}

              <div className="page-nav-wrap text-center wow fadeInUp" data-wow-delay=".3s">
                <ul>
                  <li><button type="button" className="previous">Previous</button></li>
                  <li><button type="button" className="page-numbers active">1</button></li>
                  <li><button type="button" className="page-numbers">2</button></li>
                  <li><button type="button" className="page-numbers">3</button></li>
                  <li><button type="button" className="next">Next</button></li>
                </ul>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default NewsPage;
