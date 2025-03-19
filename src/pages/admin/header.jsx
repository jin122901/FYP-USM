import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../assets/vendor/bootstrap/css/bootstrap.min.css";
import "../../assets/vendor/bootstrap-icons/bootstrap-icons.css";
import "../../assets/css/main.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Header = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

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

  // 🔹 Logout Function
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/logout", {}, { withCredentials: true });

      // ✅ Clear session data from local storage
      localStorage.removeItem("userType");

      // ✅ Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header id="header" className="header d-flex align-items-center sticky-top">
      <div className="container-fluid container-xl position-relative d-flex align-items-center">
        {/* Logo */}
        <Link to="/AdminPage" className="logo d-flex align-items-center me-auto">
          <h1 className="sitename">EduInsight</h1>
        </Link>

        {/* Navigation */}
        <nav id="navmenu" className={`navmenu ${isMobileNavOpen ? "mobile-nav-active" : ""}`}>
          <ul>
            <li><Link to="/AdminPage" onClick={() => setIsMobileNavOpen(false)}>Home</Link></li>
            <li><a href="/usermanagement" onClick={() => setIsMobileNavOpen(false)}>User Management</a></li>
            <li><a href="#services" onClick={() => setIsMobileNavOpen(false)}>Services</a></li>
          </ul>
        </nav>

        {/* Logout Button */}
        <button className="btn-getstarted" onClick={handleLogout}>Logout</button>

        {/* Mobile Nav Toggle Button */}
        <i className={`mobile-nav-toggle d-xl-none bi ${isMobileNavOpen ? "bi-x" : "bi-list"}`} 
        onClick={toggleMobileNav}>
        </i>

      </div>
    </header>
  );
};

export default Header;
