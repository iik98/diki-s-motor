import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const ProtectedRoute: React.FC<{
  children: JSX.Element;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading, role } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role || ""))
    return <div>Access denied</div>;
  return children;
};
