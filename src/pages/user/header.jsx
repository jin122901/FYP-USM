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
  const [userType, setUserType] = useState(null);
  const checkSession = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/check_session", {
        credentials: "include", // Ensure cookies are sent
      });
  
      if (response.ok) {
        const data = await response.json();
        setUserType(data.user_type);
      } else {
        alert("Session expired. Logging out...");
        setUserType(null);
        navigate("/login");
      }
    } catch (error) {
      console.error("Error checking session:", error);
    }
  };
  
  useEffect(() => {
    const interval = setInterval(checkSession, 60000); // Check every 1 min
    return () => clearInterval(interval);
  }, []);

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
      const response = await fetch("http://127.0.0.1:5000/api/logout", { // 🔹 Use the correct URL
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
      alert(data.message);
  
      if (response.ok) {
        localStorage.removeItem("user_type"); // Clear user role
        window.location.href = "/login"; // Redirect to login page
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  

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

        {/* Logout Button */}
        <Link className="btn-getstarted" onClick={handleLogout}>Logout</Link>

        {/* Mobile Nav Toggle Button */}
        <i className={`mobile-nav-toggle d-xl-none bi ${isMobileNavOpen ? "bi-x" : "bi-list"}`} 
        onClick={toggleMobileNav}>
        </i>

      </div>
    </header>
  );
};

export default Header;
