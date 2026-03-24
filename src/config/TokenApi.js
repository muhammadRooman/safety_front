// import axios from "axios";
// import { toast } from "react-toastify";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_BASE_ADMIN_API,
// });

// // ✅ Request Interceptor: every request token send in header
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token"); // Get token from localStorage
//     if (token) {
//       try {
//         config.headers.Authorization = `Bearer ${JSON.parse(token)}`; // Parse only if not null
//       } catch (error) {
//         console.error("Error parsing token:", error);
//       }
//     }
//     config.headers['ngrok-skip-browser-warning'] = '69420';
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );


// // ✅ Response Interceptor: 403 & 401 Errors handel
// api.interceptors.response.use(
//   (response) => {
//     if (response.data.status === "200") {
//       return response;
//     }

//     //  If status is 403 or 401, log the user out
//     if (response.data.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       localStorage.removeItem("userId");
//       window.location.href = "/login";
//     }

//     return response; // ✅ Response return karna
//   },
//   (error) => {
//     //   If status is 403 or 401, log the user out
//     if (error.response?.status === 403 || error.response?.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       localStorage.removeItem("userId");
//       window.location.href = "/login";
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;




//      With persists


import axios from "axios";
import { toast } from "react-toastify";
const TokenApi = axios.create({
  baseURL: process.env.REACT_APP_BASE_ADMIN_API,
});

TokenApi.interceptors.request.use(
  
  (config) => {
console.log("config",config);
    const authData = JSON.parse(localStorage.getItem("persist:auth"));
    const token = authData?.token ? JSON.parse(authData.token) : null;
    console.log("token......",token);
    console.log("authData......",authData);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["ngrok-skip-browser-warning"] = "true";

    return config;
  },
  (error) => Promise.reject(error)
);

TokenApi.interceptors.response.use(
  (response) => {
    if (response?.data.status === 401) {
      localStorage.clear();
      window.location.replace("/login");
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      toast.error("Session expired! Please log in again.");
      // localStorage.clear();
      // window.location.replace("/login");
    }
    if (error.response?.status === 403) {
      toast.warning("You don't have permission to access this resource.");
    }

    return Promise.reject(error);
  }
);

export default TokenApi;
