// src/Layout.jsx  (or wherever your layout lives)
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';           // adjust path
import Navbar from '../sidebar/TopNavbar';            // adjust path
import LoaderOverlay from "./LoaderOverlay";
import { useLoader } from "./LoaderContext";
import RouteProgress from '../RouteProgress';
import { SidebarProvider } from '../context/SidebarContext'; // new

const Layout = () => {
  const location = useLocation();
  const { setLoading } = useLoader();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading]);

  return (
    <SidebarProvider>
      <div className="layout-wrapper">
        <RouteProgress />
        <LoaderOverlay />

        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="main-area">
          <Navbar />

          <main className="content-area">
            <Outlet />
          </main>

          <footer className="app-footer">
            <span>© {new Date().getFullYear()} All rights reserved | Developed by Muhammad Rooman</span>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;