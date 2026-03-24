// "use client";
// import React, { useState } from "react";
// import { FaEdit } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";
// import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

// const Columns = ({ handleEdit, handleDelete, user }) => {
//   const [zoomImg, setZoomImg] = useState(null);

//   const columns = [
//     {
//       name: "Name",
//       selector: (row) => row.name,
//       sortable: true,
//     },
//     {
//       name: "Email",
//       selector: (row) => row.email,
//       sortable: true,
//     },
//     {
//       name: "Phone",
//       selector: (row) => row.phone,
//       sortable: true,
//     },
//     {
//       name: "Description",
//       selector: (row) => row.description,
//       sortable: true,
//     },
//     {
//       name: "Image",
//       cell: (row) => (
//         <>
//           <img
//             src={
//               row.image
//                 ? `http://localhost:8082/uploads/${row.image}`
//                 : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
//             }
//             alt="Profile"
//             style={{
//               width: "50px",
//               height: "50px",
//               borderRadius: "4px",
//               objectFit: "cover",
//               cursor: "pointer",
//               border: "1px solid #ddd",
//               padding: "2px",
//             }}
//             onClick={() =>
//               setZoomImg(
//                 row.image
//                   ? `http://localhost:8082/uploads/${row.image}`
//                   : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
//               )
//             }
//           />

//           {zoomImg && (
//             <div
//               style={{
//                 position: "fixed",
//                 top: 0,
//                 left: 0,
//                 width: "100vw",
//                 height: "100vh",
//                 background: "rgba(0, 0, 0, 0.5)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 zIndex: 9999,
//               }}
//               onClick={() => setZoomImg(null)}
//             >
//               <img
//                 src={zoomImg}
//                 alt="Zoom"
//                 style={{
//                   width: "50%",
//                   borderRadius: "10px",
//                   boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
//                   background: "#fff",
//                 }}
//               />
//             </div>
//           )}
//         </>
//       ),
//       ignoreRowClick: true,
//       allowOverflow: true,
//       button: true,
//     },
//   ];

//   if (user?.role !== "student") {
//     columns.push({
//       name: "Actions",
//       cell: (row) => (
//         <div className="d-flex gap-2">
//             <Button
//               variant="outline-primary"
//               size="sm"
//               onClick={() => handleEdit(row)}
//             >
//               <FaEdit />
//             </Button>

//             <Button
//               variant="outline-danger"
//               size="sm"
//               onClick={() => handleDelete(row)}
//             >
//               <MdDelete />
//             </Button>
//         </div>
//       ),
//       className: "column-actions",
//     });
//   }

//   return columns;
// };

// export default Columns;
