// "use client";
// import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
// import { FaEdit } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";

// const Columns = ({ handleEdit, handleDelete }) => [
//   {
//     name: "Assignment Title",
//     selector: (row) => row.title,
//     sortable: true,
//   },
//   {
//     name: "Description",
//     selector: (row) => row.description,
//     sortable: true,
//   },
//   {
//     name: "Subject",
//     selector: (row) => row.subject,
//     sortable: true,
//   },
//   {
//     name: "Teacher Name",
//     selector: (row) => row?.teacher?.name || "N/A",
//     sortable: true,
//   },
//   {
//     name: "Marks",
//     selector: (row) =>
//       row?.marks ? (
//         row.marks
//       ) : (
//         <span
//           className="badge-pending badge bg-warning text-dark px-3 py-1 rounded-pill"
//           style={{ fontSize: "1rem", fontWeight: "600" }} // 👈 larger font
//         >
//           Pending
//         </span>
//       ),
//     sortable: true,
//   },
//   {
//     name: "Out of Marks",
//     selector: (row) =>
//       row?.outofMarks ? (
//         row.outofMarks
//       ) : (
//         <span
//           className="badge-pending badge bg-warning text-dark px-3 py-1 rounded-pill"
//           style={{ fontSize: "1rem", fontWeight: "600" }}
//         >
//           Pending
//         </span>
//       ),
//     sortable: true,
//   },

//   {
//     name: "Actions",
//     cell: (row) => (
//       <div style={{ display: "flex", gap: "10px" }}>
//           <Button
//             disabled={!!row?.marks}
//             variant="outline-primary"
//             size="sm"
//             onClick={() => handleEdit(row)}
//           >
//             <FaEdit />
//           </Button>

//           <Button
//             disabled={!!row?.marks}
//             variant="outline-danger"
//             size="sm"
//             onClick={() => handleDelete(row)}
//           >
//             <MdDelete />
//           </Button>
//       </div>
//     ),
//   },
// ];

// export default Columns;
