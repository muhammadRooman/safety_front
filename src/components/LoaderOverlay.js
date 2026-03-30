import React from "react";
import { useLoader } from "./LoaderContext";

const LoaderOverlay = () => {
  const { loading } = useLoader();
  if (!loading) return null;
  return (
    <div className="global-loader-overlay">
      <div className="global-loader-card">
        <div className="global-loader-ring" />
        <div className="global-loader-text">Loading...</div>
      </div>
    </div>
  );
};

export default LoaderOverlay;