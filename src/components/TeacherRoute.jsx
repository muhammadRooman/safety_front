import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { isTokenExpired } from "../utils/authToken";

export default function TeacherRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      // If token missing/expired, do not fetch anything.
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

  if (role !== "teacher") {
    // Student should never see admin job pages; redirect to student browse jobs.
    return <Navigate to="/dashboard/jobs-board" replace state={{ from: location.pathname }} />;
  }

  return children;
}

