import React from "react";
import heroImage from '../../assets/img/hero-img.png'; 

const Home = () => {
  return (
    <section id="hero" class="hero section">

      <div class="container">
        <div class="row gy-4">
          <div class="col-lg-6 order-2 order-lg-1 d-flex flex-column justify-content-center" data-aos="fade-up">
            <h1>Turn insights into better education</h1>
            <p>Enhance learning with student feedback</p>
            <div class="d-flex">
              <a href="/RegisterPage" class="btn-get-started">Get Started</a>
            </div>
          </div>
          <div class="col-lg-6 order-1 order-lg-2 hero-img" data-aos="zoom-out" data-aos-delay="100">
            <img src={heroImage} className="img-fluid animated" alt="Hero" />
          </div>
        </div>
      </div>

    </section>
    );
};

export default Home;
