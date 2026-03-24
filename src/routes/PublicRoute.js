import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { isTokenExpired } from "../utils/authToken";

const PublicRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  if (token && !isTokenExpired(token)) {
    // Already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default PublicRoute;