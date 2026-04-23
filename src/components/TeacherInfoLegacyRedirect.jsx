import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { adminRoutes, studentRoutes, DASHBOARD_HOME } from "../config/dashboardRoutes";
import { isTokenExpired } from "../utils/authToken";

/** Old shared `/dashboard/demo-class` → correct role-prefixed URL */
export default function TeacherInfoLegacyRedirect() {
  const token = useSelector((s) => s.auth.token);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      setTarget("/login");
      return;
    }
    let cancelled = false;
    axios
      .get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const role = res.data?.user?.role;
        if (cancelled) return;
        if (role === "teacher") setTarget(adminRoutes.teacherInfo);
        else if (role === "student") setTarget(studentRoutes.teacherInfo);
        else setTarget(DASHBOARD_HOME);
      })
      .catch(() => {
        if (!cancelled) setTarget(DASHBOARD_HOME);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!target) return <div style={{ padding: 24, textAlign: "center" }}>Loading…</div>;
  return <Navigate to={target} replace />;
}
