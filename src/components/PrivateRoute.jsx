// import React from 'react';
// import { Navigate } from 'react-router-dom';

// const PrivateRoute = ({ children }) => {
//   const isAuthenticated = localStorage.getItem('token'); // or any auth logic
//   return isAuthenticated ? children : <Navigate to="/login" />;
// };

// export default PrivateRoute;

import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/authToken';

const PrivateRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token); // assuming 'auth' slice

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default PrivateRoute;
