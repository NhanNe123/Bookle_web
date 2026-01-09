import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();
  
  const stats = [
    { number: '1995', labelKey: 'about.stats.founded', icon: 'fa-calendar' },
    { number: '28+', labelKey: 'about.stats.experience', icon: 'fa-award' },
    { number: '500K+', labelKey: 'about.stats.customers', icon: 'fa-users' },
    { number: '50K+', labelKey: 'about.stats.books', icon: 'fa-book' },
  ];

  const values = [
    {
      icon: 'fa-heart',
      titleKey: 'about.values.passion.title',
      descriptionKey: 'about.values.passion.description'
    },
    {
      icon: 'fa-star',
      titleKey: 'about.values.quality.title',
      descriptionKey: 'about.values.quality.description'
    },
    {
      icon: 'fa-shield-halved',
      titleKey: 'about.values.trust.title',
      descriptionKey: 'about.values.trust.description'
    },
    {
      icon: 'fa-handshake',
      titleKey: 'about.values.service.title',
      descriptionKey: 'about.values.service.description'
    },
    {
      icon: 'fa-truck-fast',
      titleKey: 'about.values.delivery.title',
      descriptionKey: 'about.values.delivery.description'
    },
    {
      icon: 'fa-tag',
      titleKey: 'about.values.price.title',
      descriptionKey: 'about.values.price.description'
    },
  ];

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
            <h1>{t('about.title')}</h1>
            <div className="page-header">
              <ul className="breadcrumb-items">
                <li>
                  <Link to="/">{t('header.menu.home')}</Link>
                </li>
                <li>
                  <i className="fa-solid fa-chevron-right"></i>
                </li>
                <li>{t('about.breadcrumb')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* About Hero Section */}
      <section className="about-hero-section section-padding">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="about-image mb-4 mb-lg-0">
                <img 
                  src="/assets/img/about.jpg" 
                  alt="Về Bookle" 
                  className="img-fluid rounded"
                  style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-content">
                <span className="subtitle" style={{ color: '#3040D6', fontWeight: 'bold', fontSize: '18px' }}>
                  {t('about.subtitle')}
                </span>
                <h2 className="section-title mb-4" style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {t('about.mainTitle')}
                </h2>
                <p className="mb-3" style={{ fontSize: '16px', lineHeight: '1.8', color: '#666' }}>
                  {t('about.description1')}
                </p>
                <p className="mb-4" style={{ fontSize: '16px', lineHeight: '1.8', color: '#666' }}>
                  {t('about.description2')}
                </p>
                <Link to="/shop" className="theme-btn">
                  {t('about.exploreProducts')} <i className="fa-solid fa-arrow-right-long"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section section-padding" style={{ background: '#f8f9fa' }}>
        <div className="container">
          <div className="row">
            {stats.map((stat, index) => (
              <div key={index} className="col-6 col-md-3 mb-4 mb-md-0">
                <div className="stat-item text-center">
                  <div className="stat-icon mb-3">
                    <i className={`fa-solid ${stat.icon}`} style={{ fontSize: '48px', color: '#3040D6' }}></i>
                  </div>
                  <h3 className="stat-number mb-2" style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {stat.number}
                  </h3>
                  <p className="stat-label" style={{ fontSize: '16px', color: '#666' }}>
                    {t(stat.labelKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision-section section-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="mission-box h-100 p-4" style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
                <div className="icon mb-3">
                  <i className="fa-solid fa-bullseye" style={{ fontSize: '48px', color: '#3040D6' }}></i>
                </div>
                <h3 className="mb-4" style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {t('about.mission.title')}
                </h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#666', marginBottom: '15px' }}>
                  {t('about.mission.description')}
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li className="mb-2">
                    <i className="fa-solid fa-check" style={{ color: '#3040D6', marginRight: '10px' }}></i>
                    {t('about.mission.item1')}
                  </li>
                  <li className="mb-2">
                    <i className="fa-solid fa-check" style={{ color: '#3040D6', marginRight: '10px' }}></i>
                    {t('about.mission.item2')}
                  </li>
                  <li className="mb-2">
                    <i className="fa-solid fa-check" style={{ color: '#3040D6', marginRight: '10px' }}></i>
                    {t('about.mission.item3')}
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="vision-box h-100 p-4" style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
                <div className="icon mb-3">
                  <i className="fa-solid fa-eye" style={{ fontSize: '48px', color: '#3040D6' }}></i>
                </div>
                <h3 className="mb-4" style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  {t('about.vision.title')}
                </h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#666', marginBottom: '15px' }}>
                  {t('about.vision.description')}
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li className="mb-2">
                    <i className="fa-solid fa-check" style={{ color: '#3040D6', marginRight: '10px' }}></i>
                    {t('about.vision.item1')}
                  </li>
                  <li className="mb-2">
                    <i className="fa-solid fa-check" style={{ color: '#3040D6', marginRight: '10px' }}></i>
                    {t('about.vision.item2')}
                  </li>
                  <li className="mb-2">
                    <i className="fa-solid fa-check" style={{ color: '#3040D6', marginRight: '10px' }}></i>
                    {t('about.vision.item3')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="values-section section-padding" style={{ background: '#f8f9fa' }}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <span className="subtitle" style={{ color: '#3040D6', fontWeight: 'bold', fontSize: '18px' }}>
                {t('about.values.subtitle')}
              </span>
              <h2 className="section-title mt-2" style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a' }}>
                {t('about.values.title')}
              </h2>
              <p className="lead" style={{ color: '#666', maxWidth: '700px', margin: '0 auto' }}>
                {t('about.values.description')}
              </p>
            </div>
          </div>
          <div className="row">
            {values.map((value, index) => (
              <div key={index} className="col-md-6 col-lg-4 mb-4">
                <div className="value-card h-100 p-4" style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', transition: 'transform 0.3s' }}>
                  <div className="value-icon mb-3">
                    <i className={`fa-solid ${value.icon}`} style={{ fontSize: '40px', color: '#3040D6' }}></i>
                  </div>
                  <h4 className="value-title mb-3" style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {t(value.titleKey)}
                  </h4>
                  <p className="value-description" style={{ fontSize: '15px', lineHeight: '1.7', color: '#666', margin: 0 }}>
                    {t(value.descriptionKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section section-padding">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <span className="subtitle" style={{ color: '#3040D6', fontWeight: 'bold', fontSize: '18px' }}>
                {t('about.timeline.subtitle')}
              </span>
              <h2 className="section-title mt-2" style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a1a' }}>
                {t('about.timeline.title')}
              </h2>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="timeline">
                <div className="timeline-item mb-4">
                  <div className="timeline-year" style={{ fontWeight: 'bold', fontSize: '20px', color: '#3040D6' }}>1995</div>
                  <div className="timeline-content p-3" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '10px' }}>{t('about.timeline.1995.title')}</h5>
                    <p style={{ margin: 0, color: '#666' }}>{t('about.timeline.1995.description')}</p>
                  </div>
                </div>
                <div className="timeline-item mb-4">
                  <div className="timeline-year" style={{ fontWeight: 'bold', fontSize: '20px', color: '#3040D6' }}>2005</div>
                  <div className="timeline-content p-3" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '10px' }}>{t('about.timeline.2005.title')}</h5>
                    <p style={{ margin: 0, color: '#666' }}>{t('about.timeline.2005.description')}</p>
                  </div>
                </div>
                <div className="timeline-item mb-4">
                  <div className="timeline-year" style={{ fontWeight: 'bold', fontSize: '20px', color: '#3040D6' }}>2015</div>
                  <div className="timeline-content p-3" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '10px' }}>{t('about.timeline.2015.title')}</h5>
                    <p style={{ margin: 0, color: '#666' }}>{t('about.timeline.2015.description')}</p>
                  </div>
                </div>
                <div className="timeline-item mb-4">
                  <div className="timeline-year" style={{ fontWeight: 'bold', fontSize: '20px', color: '#3040D6' }}>2020</div>
                  <div className="timeline-content p-3" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '10px' }}>{t('about.timeline.2020.title')}</h5>
                    <p style={{ margin: 0, color: '#666' }}>{t('about.timeline.2020.description')}</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-year" style={{ fontWeight: 'bold', fontSize: '20px', color: '#3040D6' }}>2023</div>
                  <div className="timeline-content p-3" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
                    <h5 style={{ fontWeight: 'bold', marginBottom: '10px' }}>{t('about.timeline.2023.title')}</h5>
                    <p style={{ margin: 0, color: '#666' }}>{t('about.timeline.2023.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="commitment-section section-padding" style={{ background: 'linear-gradient(135deg, #3040D6 0%, #1a2a9e 100%)', color: '#fff' }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="mb-4" style={{ fontSize: '36px', fontWeight: 'bold' }}>
                {t('about.commitment.title')}
              </h2>
              <p className="lead mb-5" style={{ fontSize: '18px', lineHeight: '1.8' }}>
                {t('about.commitment.description')}
              </p>
              <div className="row text-center">
                <div className="col-md-4 mb-3 mb-md-0">
                  <i className="fa-solid fa-book-open mb-3" style={{ fontSize: '48px' }}></i>
                  <h5 className="mb-2">{t('about.commitment.original.title')}</h5>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>{t('about.commitment.original.description')}</p>
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <i className="fa-solid fa-rotate-left mb-3" style={{ fontSize: '48px' }}></i>
                  <h5 className="mb-2">{t('about.commitment.return.title')}</h5>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>{t('about.commitment.return.description')}</p>
                </div>
                <div className="col-md-4">
                  <i className="fa-solid fa-headset mb-3" style={{ fontSize: '48px' }}></i>
                  <h5 className="mb-2">{t('about.commitment.support.title')}</h5>
                  <p style={{ fontSize: '14px', opacity: 0.9 }}>{t('about.commitment.support.description')}</p>
                </div>
              </div>
              <div className="mt-5">
                <Link to="/contact" className="theme-btn" style={{ background: '#fff', color: '#3040D6' }}>
                  {t('about.commitment.contactUs')} <i className="fa-solid fa-arrow-right-long"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
