import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./pages/public/header";
import AdminHeader from "./pages/admin/header";
import UserHeader from "./pages/user/header";
import Home from "./pages/public/home";
import Login from "./pages/public/Login";
import RegisterPage from "./pages/public/RegisterPage";
import AdminPage from "./pages/admin/home";
import UserPage from "./pages/user/home";
import Footer from "./pages/public/footer";
import ProtectedRoute from "../backend/routes/protectedroute";


const App = () => {
  
  return (
    <Router>
      <Routes>
        {/* Public Page - No Restriction */}
        <Route path="/" element={<><Header /><Home /><Footer /></>} />

        {/* Login Page */}
        <Route path="/login" element={<><Header /><Login /><Footer /></>} />

        {/* Login Page */}
        <Route path="/RegisterPage" element={<><Header /><RegisterPage /><Footer /></>} />

        {/* Protect Admin Route (Only usr_type = 0 can access) */}
        <Route
            path="/admin"
            element={
                <ProtectedRoute allowedRoles={[0]}>
                    <>
                      <AdminHeader />
                      <AdminPage />
                      <Footer />
                    </>
                </ProtectedRoute>
            }
        />

        {/* Protect User Route (Only usr_type = 1 can access) */}
        <Route
            path="/user"
            element={
                <ProtectedRoute allowedRoles={[1]}>
                    <>
                      <UserHeader />
                      <UserPage />
                      <Footer />
                    </>
                </ProtectedRoute>
            }
        />
      </Routes>
      
    </Router>
  );
};

export default App;
