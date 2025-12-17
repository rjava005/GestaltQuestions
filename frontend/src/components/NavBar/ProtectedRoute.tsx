import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { AllowedRoles } from "../../types/userTypes";

export default function ProtectedRoute({
    children,
    allowedRoles,
    publicRoute = false
}: {
    children: React.ReactNode;
    allowedRoles: AllowedRoles;
    publicRoute?: boolean;
}) {
    const { user, userData } = useAuth();

    // If route is public → no restrictions
    if (publicRoute || allowedRoles.length === 0) {
        return children;
    }

    // Not logged in
    if (!user || !userData) return <Navigate to="/login" replace />;

    // No role or invalid role
    if (!userData?.role || !allowedRoles.includes(userData.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
