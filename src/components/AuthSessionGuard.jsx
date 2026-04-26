import { useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../redux/Auth/AuthSlice";
import { getTokenExpiryMs, isTokenExpired } from "../utils/authToken";

const AuthSessionGuard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((state) => state.auth.token);
  const timeoutRef = useRef(null);
  const loggedOutRef = useRef(false);
  const heartbeatRef = useRef(null);

  const doLogout = () => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  // Reset one-shot logout guard when a valid token appears again (fresh login).
  useEffect(() => {
    if (token) {
      loggedOutRef.current = false;
    }
  }, [token]);

  // Logout exactly when JWT expires.
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!token) return undefined;

    if (isTokenExpired(token)) {
      doLogout();
      return undefined;
    }

    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return undefined;

    const delay = Math.max(0, expiryMs - Date.now());
    timeoutRef.current = setTimeout(() => {
      doLogout();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [token]);

  // Also logout if backend returns unauthorized / expired token.
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const message = String(
          error?.response?.data?.message || error?.response?.data?.error || ""
        ).toLowerCase();
        const isExpiredMsg =
          message.includes("token") &&
          (message.includes("expired") || message.includes("invalid") || message.includes("unauthorized"));
        const isDisabledMsg =
          message.includes("disabled") ||
          message.includes("deactivate") ||
          message.includes("reactivate");

        if (status === 401 || isExpiredMsg || ((status === 403 || status === 401) && isDisabledMsg)) {
          doLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  // Heartbeat: if admin disables account, auto-logout without page refresh.
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (!token) return undefined;

    heartbeatRef.current = setInterval(async () => {
      try {
        await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
          showGlobalLoader: false,
        });
      } catch (error) {
        const status = error?.response?.status;
        const message = String(
          error?.response?.data?.message || error?.response?.data?.error || ""
        ).toLowerCase();
        if (status === 401 || status === 403 || message.includes("disabled") || message.includes("deactivate")) {
          doLogout();
        }
      }
    }, 5000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [token]);

  // If user manually opens protected URL with expired token, kick to login.
  useEffect(() => {
    if (!token) return;
    if (isTokenExpired(token) && location.pathname !== "/login") {
      doLogout();
    }
  }, [token, location.pathname]);

  return null;
};

export default AuthSessionGuard;
