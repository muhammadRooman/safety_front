// "use client";
// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { AiFillFilePdf } from "react-icons/ai";
// import { FaCheck } from "react-icons/fa";

// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-toastify";

// const Columns = ({ handleEdit, handleDelete, fetchBlogs }) => {
//   const [zoomImg, setZoomImg] = useState(null);
//   const token = useSelector((state) => state.auth.token);
//   const { id } = useParams();
//   const [marksInput, setMarksInput] = useState({});
//   const [outofMarksInput, setOutofMarksInput] = useState({});

//   const handleInputChange = (id, value) => {
//     setMarksInput((prev) => ({
//       ...prev,
//       [id]: value,
//     }));
//   };

//   const handleOutofChange = (id, value) => {
//     setOutofMarksInput((prev) => ({
//       ...prev,
//       [id]: value,
//     }));
//   };

//   const handleSubmitMarks = async (id) => {
//     const marksValue = marksInput[id];
//     const outofValue = outofMarksInput[id];

//     // Convert to number safely
//     const marks = Number(marksValue);
//     const outofMarks = Number(outofValue);

//     // Validation: Check if values are missing or not numbers
//     if (
//       marksValue === undefined ||
//       outofValue === undefined ||
//       marksValue === "" ||
//       outofValue === "" ||
//       isNaN(marks) ||
//       isNaN(outofMarks)
//     ) {
//       toast.error("Please enter valid numbers for Marks and Out of Marks");
//       return;
//     }

//     // Validation: marks should not be greater than outofMarks
//     if (marks > outofMarks) {
//       toast.error("Marks should not be greater than Out of Marks");
//       return;
//     }

//     try {
//       const res = await axios.post(
//         `http://localhost:8082/api/admin/assignments/marks/${id}`,
//         { marks, outofMarks },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       toast.success("Marks updated successfully");
//       if (fetchBlogs) await fetchBlogs(); // Use parent fetchBlogs to refresh table
//     } catch (error) {
//       console.error("Error updating marks", error);
//       toast.error("Failed to update marks");
//     }
//   };

//   return [
//     { name: "Title", selector: (row) => row.title, sortable: true },
//     {
//       name: "Student Name",
//       selector: (row) => row.student.name,
//       sortable: true,
//     },
//     {
//       name: "Student Email",
//       selector: (row) => row.student.email,
//       sortable: true,
//     },
//     { name: "Student Subject", selector: (row) => row.subject, sortable: true },
//     {
//       name: "Teacher Name",
//       selector: (row) => row.teacher.name,
//       sortable: true,
//     },
//     { name: "Markds", selector: (row) => row.marks },
//     { name: "out of Markds", selector: (row) => row.outofMarks },

//     // {
//     //   name: "Image",
//     //   cell: (row) =>
//     //     row.image ? (
//     //       <img
//     //         src={`http://localhost:8082${row.image}`}
//     //         alt={row.title}
//     //         style={{
//     //           width: "50px",
//     //           height: "50px",
//     //           borderRadius: "4px",
//     //           objectFit: "cover",
//     //         }}
//     //       />
//     //     ) : (
//     //       "No Image"
//     //     ),
//     //   ignoreRowClick: true,
//     //   allowOverflow: true,
//     //   button: true,
//     // },

//   {
//   name: "Image",
//   cell: (row) => (
//     <div style={{ marginBottom: "10px" }}>
//       <img
//         src={
//           row.image
//             ? `http://localhost:8082${
//                 row.image.startsWith("/") ? "" : "/"
//               }${row.image}`
//             : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
//         }
//         alt="Profile"
//         style={{
//           width: "50px",
//           height: "50px",
//           borderRadius: "4px",
//           objectFit: "cover",
//           cursor: "pointer",
//           transition: "transform 0.3s ease-in-out",
//         }}
//         onMouseEnter={(e) => {
//           e.currentTarget.style.transform = "scale(1.2)";
//         }}
//         onMouseLeave={(e) => {
//           e.currentTarget.style.transform = "scale(1)";
//         }}
//         onClick={() =>
//           setZoomImg(
//             row.image
//               ? `http://localhost:8082${
//                   row.image.startsWith("/") ? "" : "/"
//                 }${row.image}`
//               : "https://cdn-icons-png.flaticon.com/512/847/847969.png"
//           )
//         }
//       />
//     </div>
//   ),
//   ignoreRowClick: true,
//   allowOverflow: true,
//   button: true,
// },

//   {
//   name: "PDF",
//   cell: (row) => {
//     const pdfPath = row.pdf
//       ? row.pdf.startsWith("/") ? row.pdf.slice(1) : row.pdf
//       : null;

//     return (
//       <div style={{ marginBottom: "10px" }}>
//         {pdfPath ? (
//           <a
//             href={`http://localhost:8082/${pdfPath}`}
//             target="_blank"
//             rel="noopener noreferrer"
//             style={{
//               color: "#d32f2f",
//               textDecoration: "none",
//               display: "flex",
//               alignItems: "center",
//               gap: "5px",
//               fontWeight: "500",
//             }}
//           >
//             <AiFillFilePdf size={25} />
//             View PDF
//           </a>
//         ) : (
//           <span className="text-muted">No PDF</span>
//         )}
//       </div>
//     );
//   },
//   ignoreRowClick: true,
//   allowOverflow: true,
//   button: true,
// },

//   {
//   name: "Upload Marks",
//   cell: (row) => (
//     <div
//      style={{
//   display: "flex",
//   flexDirection: "column",
//   gap: "4px",
//   margin: "9px -10px 14px 6px"  // ✅ Corrected
// }}

//     >
//       <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
//         <input
//         className="marks-input"
//           type="number"
//           placeholder="Marks"
//           value={marksInput[row._id] || ""}
//           onChange={(e) => handleInputChange(row._id, e.target.value)}
//         style={{  marginLeft: "22px", width: "70px", padding: "4px", fontSize: "14px" }}
//         />
//         <input
//           type="number"
//           placeholder="Out of"
//           value={outofMarksInput[row._id] || ""}
//           onChange={(e) => handleOutofChange(row._id, e.target.value)}
//           style={{ width: "70px", padding: "4px", fontSize: "14px" }}
//         />
//       </div>
//     </div>
//   ),
//   ignoreRowClick: true,
//   allowOverflow: true,
//   button: true,
// }
// ,

// {
//   name: "Action",
//   right: true, // 👈 this aligns the column header and its contents to the right
//   cell: (row) => (
//     <div style={{  marginBottom: "10px" }}>
//       <button
//         onClick={() => handleSubmitMarks(row._id)}
//         style={{
//           backgroundColor: "#4CAF50",
//           color: "white",
//           border: "none",
//           padding: "5px 10px",
//           cursor: "pointer",
//           borderRadius: "4px",
//           fontSize: "13px",
//        margin: "22px -14px 11px 5px", 
//           display: "flex",
//           alignItems: "center",
//           gap: "5px",
//         }}
//       >
//         <FaCheck size={12} />
//         Submit
//       </button>
//     </div>
//   ),
// }


//   ];
// };

// export default Columns;
