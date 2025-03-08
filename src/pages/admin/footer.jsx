import React from "react";

const Footer = () => {
  return (
    <footer id="footer" className="footer">
      <div className="container footer-top">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6 footer-about">
            <a href="/" className="d-flex align-items-center">
              <span className="sitename">EduInsight</span>
            </a>
            
          </div>
          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Useful Links</h4>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About us</a></li>
              <li><a href="#">Services</a></li>
            </ul>
          </div>
          <div className="col-lg-4 col-md-12">
            <h4>Follow Us</h4>
            <div className="social-links d-flex">
              <a href="#"><i className="bi bi-twitter-x"></i></a>
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
            </div>
          </div>
        </div>
      </div>
      <div className="container text-center mt-4">
        <p>© Copyright <strong className="sitename">EduInsight</strong> All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
