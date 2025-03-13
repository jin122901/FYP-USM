import React from "react";
import heroImage from '../../assets/img/hero-img.png'; 
import { useSession } from "../../components/session";
const Home = () => {
  const { userEmail } = useSession(); 
  return (
    <section id="hero" className="hero section">

      <div className="container">
        <div className="row gy-4">
          <div className="col-lg-6 order-2 order-lg-1 d-flex flex-column justify-content-center" data-aos="fade-up">
            <h1>Turn insights into better education</h1>
            <p>Enhance learning with student feedback</p>
            {userEmail && <p>Your Email: {userEmail}</p>}
            <div class="d-flex">
              <a href="/uploadpage" class="btn-get-started">Get Started</a>
            </div>
          </div>
          <div className="col-lg-6 order-1 order-lg-2 hero-img" data-aos="zoom-out" data-aos-delay="100">
            <img src={heroImage} className="img-fluid animated" alt="Hero" />
          </div>
        </div>
      </div>

    </section>
    );
};

export default Home;
