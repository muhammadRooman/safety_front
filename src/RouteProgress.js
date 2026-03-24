import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, trickleSpeed: 80 });

const RouteProgress = () => {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    // End progress after a short delay (simulate loading)
    const timer = setTimeout(() => {
      NProgress.done();
    }, 700); // adjust as needed

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location]);

  return null;
};

export default RouteProgress;