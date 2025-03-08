import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../assets/vendor/bootstrap/css/bootstrap.min.css";
import "../../assets/vendor/bootstrap-icons/bootstrap-icons.css";
import "../../assets/css/main.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Header = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
    document.body.classList.toggle("mobile-nav-active");
  };

  // Close mobile menu when resizing to large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1199) {
        setIsMobileNavOpen(false);
        document.body.classList.remove("mobile-nav-active");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header id="header" className="header d-flex align-items-center sticky-top">
      <div className="container-fluid container-xl position-relative d-flex align-items-center">
        {/* Logo */}
        <Link to="/" className="logo d-flex align-items-center me-auto">
          <h1 className="sitename">EduInsight</h1>
        </Link>

        {/* Navigation */}
        <nav id="navmenu" className={`navmenu ${isMobileNavOpen ? "mobile-nav-active" : ""}`}>
          <ul>
            <li><Link to="/" onClick={() => setIsMobileNavOpen(false)}>Home</Link></li>
            <li><a href="#about" onClick={() => setIsMobileNavOpen(false)}>About</a></li>
            <li><a href="#services" onClick={() => setIsMobileNavOpen(false)}>Services</a></li>
          </ul>
        </nav>

        {/* Get Started Button */}
        <Link className="btn-getstarted" to="/login">Login</Link>

        {/* Mobile Nav Toggle Button */}
        <i className={`mobile-nav-toggle d-xl-none bi ${isMobileNavOpen ? "bi-x" : "bi-list"}`} 
        onClick={toggleMobileNav}>
        </i>

      </div>
    </header>
  );
};

export default Header;
