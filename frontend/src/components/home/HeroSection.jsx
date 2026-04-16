import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Minh họa kệ sách — màu theo theme động (CSS variables) */
const SHELF_ROWS = [
  [
    { h: 108, c: 'var(--primary-color)' },
    { h: 96, c: 'color-mix(in srgb, var(--primary-color), #000000 22%)' },
    { h: 118, c: 'color-mix(in srgb, var(--primary-color), #ffffff 12%)' },
    { h: 88, c: 'color-mix(in srgb, var(--primary-color), #000000 12%)' },
    { h: 102, c: 'var(--primary-color)' },
  ],
  [
    { h: 98, c: 'color-mix(in srgb, var(--secondary-color), #000000 18%)' },
    { h: 112, c: 'color-mix(in srgb, var(--secondary-color), #000000 28%)' },
    { h: 92, c: 'var(--secondary-color)' },
    { h: 104, c: 'color-mix(in srgb, var(--secondary-color), #000000 22%)' },
    { h: 96, c: 'color-mix(in srgb, var(--secondary-color), #000000 12%)' },
  ],
  [
    { h: 114, c: 'var(--header)' },
    { h: 90, c: 'color-mix(in srgb, var(--header), #000000 15%)' },
    { h: 100, c: 'color-mix(in srgb, var(--header), #ffffff 18%)' },
    { h: 106, c: 'color-mix(in srgb, var(--header), #000000 8%)' },
    { h: 94, c: 'var(--header)' },
  ],
];

const HeroShelfVisual = ({ ariaLabel }) => (
  <div className="hero-bookle-shelf" role="img" aria-label={ariaLabel}>
    <div className="hero-bookle-shelf-inner">
      {SHELF_ROWS.map((row, ri) => (
        <div key={ri} className="hero-bookle-shelf-tier">
          <div className="hero-bookle-spines">
            {row.map((book, bi) => (
              <div
                key={bi}
                className="hero-bookle-spine"
                style={{ height: book.h, backgroundColor: book.c }}
              />
            ))}
          </div>
          <div className="hero-bookle-board" />
        </div>
      ))}
    </div>
    <p className="hero-bookle-shelf-caption">
      <i className="fa-solid fa-book-open me-2" aria-hidden="true" />
      Bookle
    </p>
  </div>
);

const HeroSection = () => {
  const { t } = useTranslation();
  const campaigns = [
    {
      key: 'mangaWeek',
      icon: 'fa-fire',
      title: t('home.hero.campaigns.mangaWeek.title'),
      desc: t('home.hero.campaigns.mangaWeek.desc'),
    },
    {
      key: 'comboFinance',
      icon: 'fa-chart-line',
      title: t('home.hero.campaigns.comboFinance.title'),
      desc: t('home.hero.campaigns.comboFinance.desc'),
    },
    {
      key: 'textbookSeason',
      icon: 'fa-graduation-cap',
      title: t('home.hero.campaigns.textbookSeason.title'),
      desc: t('home.hero.campaigns.textbookSeason.desc'),
    },
  ];

  return (
    <div className="hero-section hero-1 hero-bookle fix">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-12 col-xl-7 col-lg-6 order-lg-1 order-2">
            <div className="hero-items hero-bookle-items">
              <div className="hero-content">
                <h6 className="wow fadeInUp hero-badge" data-wow-delay=".2s">
                  <span className="hero-badge-label">{t('home.hero.badgeLabel')}</span>
                  <span className="hero-badge-value">{t('home.hero.badgeValue')}</span>
                </h6>
                <h1 className="wow fadeInUp hero-bookle-headline" data-wow-delay=".35s">
                  {t('home.hero.title')}
                  <br />
                  <span className="hero-highlight">{t('home.hero.titleHighlight')}</span>
                </h1>
                <p className="wow fadeInUp hero-bookle-lead" data-wow-delay=".5s">
                  {t('home.hero.description')}
                </p>
                <div className="form-clt wow fadeInUp hero-bookle-actions" data-wow-delay=".65s">
                  <Link to="/shop" className="theme-btn">
                    {t('home.hero.cta')} <i className="fa-solid fa-arrow-right-long" />
                  </Link>
                  <Link to="/shop" className="hero-bookle-btn-secondary">
                    {t('home.hero.ctaSecondary')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-5 col-lg-6 order-lg-2 order-1">
            <div className="wow fadeInRight hero-bookle-visual-wrap" data-wow-delay=".3s">
              <div className="hero-bookle-visual-stack">
                <HeroShelfVisual ariaLabel={t('home.hero.shelfAria')} />
                <div className="hero-bookle-campaigns" aria-label={t('home.hero.campaigns.ariaLabel')}>
                  {campaigns.map((item) => (
                    <div key={item.key} className="hero-bookle-campaign-card">
                      <div className="hero-bookle-campaign-icon">
                        <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                      </div>
                      <div>
                        <h6>{item.title}</h6>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
