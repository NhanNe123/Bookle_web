import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="hero-section hero-1 fix">
      <div className="container">
        <div className="row">
          <div className="col-12 col-xl-8 col-lg-6">
            <div className="hero-items">
              <div className="book-shape">
                <img src="/assets/img/hero/book.png" alt="shape-img" />
              </div>
              <div className="frame-shape1 float-bob-x">
                <img src="/assets/img/hero/frame.png" alt="shape-img" />
              </div>
              <div className="frame-shape2 float-bob-y">
                <img src="/assets/img/hero/frame-2.png" alt="shape-img" />
              </div>
              <div className="frame-shape3">
                <img src="/assets/img/hero/xstar.png" alt="img" />
              </div>
              <div className="frame-shape4 float-bob-x">
                <img src="/assets/img/hero/frame-shape.png" alt="img" />
              </div>
              <div className="bg-shape1">
                <img src="/assets/img/hero/bg-shape.png" alt="shape-bg" />
              </div>
              <div className="bg-shape2">
                <img src="/assets/img/hero/bg-shape2.png" alt="shape-bg" />
              </div>
              <div className="hero-content">
                <h6 className="wow fadeInUp" data-wow-delay=".3s">Up to 30% Off</h6>
                <h1 className="wow fadeInUp" data-wow-delay=".5s">
                  Get Your New Book <br /> With The Best Price
                </h1>
                <div className="form-clt wow fadeInUp" data-wow-delay=".9s">
                  <Link to="/shop" className="theme-btn">
                    Shop Now <i className="fa-solid fa-arrow-right-long"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-4 col-lg-6">
            <div className="hero-image">
              <img src="/assets/img/hero/hero-girl.png" alt="img" className="wow fadeInRight" data-wow-delay=".3s" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
