// "use client";
// import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
// import { FaEdit } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";
// import { MdAssignment } from "react-icons/md";

// const Columns = ({ handleEdit, handleDelete, handleSeeAllTeachers,handleCheckAssignmnet }) => [
 
//   { name: "Name", selector: (row) => row.name, sortable: true },
//   { name: "Email", selector: (row) => row.email, sortable: true },
//   { name: "Phone", selector: (row) => row.phone, sortable: true },
//     { name: "Address", selector: (row) => row.address, sortable: true },
  
//   {
//     name: "Image",
//     cell: (row) => (
//       <img
//         src={`http://localhost:8082/uploads/${row.image}`}
//         alt={row.name}
//         style={{
//           width: "50px",
//           height: "50px",
//           borderRadius: "4px",
//           objectFit: "cover",
//         }}
//       />
//     ),
//     ignoreRowClick: true,
//     allowOverflow: true,
//     button: true,
//   },


//   {
//       name: "Actions",
//       cell: (row) => (
//         <div style={{ display: "flex", gap: "10px" }}>
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
//           {/* <button
//             style={{
//               padding: "5px 10px",
//               backgroundColor: "#d32f2f",
//               color: "#fff",
//               border: "none",
//               borderRadius: "4px",
//               cursor: "pointer",
//             }}
//             onClick={() => handleSeeAllTeachers(row)}
//           >
//             See all teachers
//           </button> */}
//         <button
//   className="badge-pendings badge bg-warning text-dark px-3 py-1 rounded-pill"
//   style={{
//     padding: "5px 10px",
//     backgroundColor: "blue", // Changed to blue
//     color: "#fff",
//     border: "none",
//     borderRadius: "4px",
//     cursor: "pointer",
//   }}
//   onClick={() => handleCheckAssignmnet(row)}
// >
//   <MdAssignment style={{ color: "red", marginRight: 4, marginBottom: 2 }} /> {/* Icon red */}
//   BlanKing Mensa
// </button>

//         </div>
//       ),
//     },
// ];

// export default Columns;
