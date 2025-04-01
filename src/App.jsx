import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./pages/public/header";
import AdminHeader from "./pages/admin/header";
import UserHeader from "./pages/user/header";
import Home from "./pages/public/home";
import Login from "./pages/public/Login";
import RegisterPage from "./pages/public/RegisterPage";
import AdminPage from "./pages/admin/home";
import UserPage from "./pages/user/home";
import UploadForm from "./pages/user/uploadfile";
import resultpage from "./pages/user/result";
import Footer from "./pages/public/footer";
import ProtectedRoute from "../backend/routes/protectedroute";
import Account from "./pages/user/account";
import UserManagement from "./pages/admin/usermanagement"
import { SessionProvider } from "./components/session"; // Import SessionProvider

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes - No session needed */}
        <Route path="/" element={<><Header /><Home /><Footer /></>} />
        <Route path="/login" element={<><Header /><Login /><Footer /></>} />
        <Route path="/RegisterPage" element={<><Header /><RegisterPage /><Footer /></>} />

        {/* 🔹 Wrap only protected routes with SessionProvider */}
        <Route
          path="/*"
          element={
            <SessionProvider>
              <Routes>
                {/* Protected Admin Route (Only usr_type = 0 can access) */}
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

                <Route
                  path="/UserManagement"
                  element={
                    <ProtectedRoute allowedRoles={[0]}>
                      <>
                        <AdminHeader />
                        <UserManagement />
                        <Footer />
                      </>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/AdminPage"
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

                {/* Protected User Routes (Only usr_type = 1 can access) */}
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
                <Route
                  path="/uploadPage"
                  element={
                    <ProtectedRoute allowedRoles={[1]}>
                      <>
                        <UserHeader />
                        <UploadForm />
                        <Footer />
                      </>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute allowedRoles={[1]}>
                      <>
                        <UserHeader />
                        <Account />
                        <Footer />
                      </>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/UserPage"
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
                <Route
                  path="/resultpage"
                  element={
                    <ProtectedRoute allowedRoles={[1]}>
                      <>
                        <UserHeader />
                        <resultpage />
                        <Footer />
                      </>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SessionProvider>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
