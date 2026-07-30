import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const accessToken = localStorage.getItem("access");
    const userData = localStorage.getItem("user");

    if (!accessToken || !userData) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        return <Navigate to="/" replace />;
    }

    try {
        JSON.parse(userData);
    } catch {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;