import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProductById } from '../../lib/api';
import {
  getRecentlyViewedProductIds,
  RECENTLY_VIEWED_CHANGED_EVENT,
} from '../../utils/recentlyViewed';
import { getProductImage } from '../../utils/categoryUtils';

const SIDEBAR_LIMIT = 6;

const RecentlyViewedSidebar = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const ids = getRecentlyViewedProductIds().slice(0, SIDEBAR_LIMIT);
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map((productId) => getProductById(productId).catch(() => null))
      );
      const ordered = ids
        .map((id, i) => ({ id, doc: results[i] }))
        .filter((x) => x.doc && x.doc._id)
        .map((x) => x.doc);
      setItems(ordered);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(RECENTLY_VIEWED_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [load]);

  if (!loading && items.length === 0) {
    return (
      <div className="single-sidebar-widget">
        <div className="wid-title">
          <h5>
            <i className="fa-regular fa-clock me-2" style={{ color: 'var(--theme, #036280)' }} aria-hidden="true" />
            {t('shop.recentlyViewed.title')}
          </h5>
        </div>
        <p className="text-muted small mb-0" style={{ fontSize: '13px', lineHeight: 1.5 }}>
          {t('shop.recentlyViewed.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="single-sidebar-widget">
      <div className="wid-title">
        <h5>
          <i className="fa-regular fa-clock me-2" style={{ color: 'var(--theme, #036280)' }} aria-hidden="true" />
          {t('shop.recentlyViewed.title')}
        </h5>
      </div>
      {loading && (
        <p className="text-muted small mb-0">{t('shop.recentlyViewed.loading')}</p>
      )}
      {!loading && (
        <ul className="list-unstyled mb-0" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((p) => {
            const href = `/shop-details/${p.slug || p._id}`;
            const img = getProductImage(p.images, p.coverImage);
            return (
              <li key={p._id}>
                <Link
                  to={href}
                  className="d-flex align-items-center gap-2 text-decoration-none"
                  style={{ color: 'var(--text, #4F536C)' }}
                >
                  <div className="book-mini-cover book-mini-cover--sm">
                    <img src={img} alt={p.name || ''} loading="lazy" decoding="async" />
                  </div>
                  <span
                    className="small fw-semibold"
                    style={{
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentlyViewedSidebar;
