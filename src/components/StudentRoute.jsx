import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { isTokenExpired } from "../utils/authToken";
import { DASHBOARD_HOME } from "../config/dashboardRoutes";

/**
 * Only `student` role may access wrapped routes.
 * Teachers are redirected away so admin & student areas use different URLs.
 */
export default function StudentRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (!token || isTokenExpired(token)) {
        if (!cancelled) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nextRole = res.data?.user?.role || null;
        if (!cancelled) setRole(nextRole);
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (loading) return <div style={{ padding: 24, textAlign: "center" }}>Loading…</div>;

  if (role !== "student") {
    return <Navigate to={DASHBOARD_HOME} replace state={{ from: location.pathname }} />;
  }

  return children;
}
