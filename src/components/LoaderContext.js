import React, { createContext, useContext, useMemo, useState } from "react";

const LoaderContext = createContext();

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
  const [manualLoading, setManualLoading] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);

  const incrementRequests = () => {
    setActiveRequests((prev) => prev + 1);
  };

  const decrementRequests = () => {
    setActiveRequests((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const loading = manualLoading || activeRequests > 0;

  const value = useMemo(
    () => ({
      loading,
      setLoading: setManualLoading,
      incrementRequests,
      decrementRequests,
    }),
    [loading]
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
    </LoaderContext.Provider>
  );
};