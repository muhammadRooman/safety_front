// export const ENV = {
//     appBaseUrl: process.env.REACT_APP_BASE_ADMIN_API,
//     encryptUserData(data) {
//         const token = data?.token || null;
//          console.log("token",token);
//         // console.log("token",token);

// import persistStore from "redux-persist/es/persistStore";

//         // if (data) {
//         //     localStorage.setItem('user', JSON.stringify(data));
//         //     localStorage.setItem('userId', JSON.stringify(id));
//         // }
//         if (token) {
//             localStorage.setItem('token', JSON.stringify(token));
//         }
//         return true;
//     },

//     getUserKeys(keys = null) {
//         const userData = JSON.parse(localStorage.getItem('user'));
//         return userData;
//     },
//     getToken() {
//         const userData = localStorage.getItem('token');
//         if (userData) {
//             return userData;
//         }
//         return {};
//     },

//     logout() {
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         localStorage.removeItem('userId');
//     },
//     objectToQueryString(body) {
//         const qs = Object.keys(body)
//             .map((key) => `${key}=${body[key]}`)
//             .join('&');
//         return qs;
//     },
// };







// with persist

export const ENV = {
    appBaseUrl: process.env.REACT_APP_BASE_ADMIN_API,
};

