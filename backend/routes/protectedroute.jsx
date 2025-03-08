import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const userType = localStorage.getItem("user_type");

    // Ensure userType is set and restrict access based on roles
    if (!userType || !allowedRoles.includes(parseInt(userType))) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
