// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { IoMdAdd } from "react-icons/io";
// import DataTable from "react-data-table-component";
// import axios from "axios";
// import { toast } from "react-toastify";
// import Columns from "./Columns";
// import { useSelector } from "react-redux";
// import { Button, Breadcrumb, Container, Row, Col, Modal } from "react-bootstrap";
// import { useTranslation } from "react-i18next";

// export default function BlogList() {
//   const { t } = useTranslation();
//   const id = useSelector((state) => state.auth.id);
//   const token = useSelector((state) => state.auth.token);
//   const navigate = useNavigate();

//   const [blogs, setBlogs] = useState([]);
//   const [filterText, setFilterText] = useState("");
//   const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [delId, setDelId] = useState("");

//   const fetchBlogs = async () => {
//     try {
//       const response = await axios.get(
//         `http://localhost:8082/api/admin/enrollTeacher/${id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (response) {
//         setBlogs(response.data);
//       }
//     } catch (err) {
//       toast.error(t("errorFetchingBlogs"));
//     }
//   };

//   useEffect(() => {
//     fetchBlogs();
//   }, []);

//   const filteredItems = blogs.filter((item) =>
//     item.name?.toLowerCase().includes(filterText.toLowerCase())
//   );

//   const handleEdit = (row) => {
//     navigate(`/dashboard/teacher_enroll/${row._id}`);
//   };

//   const handleSeeAllTeachers = () => {
//     navigate(`/dashboard/see_all_teacher_enroll`);
//   };

//   const handleCheckAssignmnet = (row) => {
//     navigate(`/dashboard/check_assignment/${row._id}`);
//   };

//   const handleDelete = (row) => {
//     setDelId(row._id);
//     setOpen(true);
//   };

//   const DeleteBlog = async () => {
//     try {
//       const response = await axios.delete(
//         `http://localhost:8082/api/admin/enrollTeacher/${delId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       toast.success(response.data.message || "Teacher deleted");
//       fetchBlogs();
//       setOpen(false);
//     } catch (err) {
//       toast.error(t("deleteError"));
//     }
//   };

//   const columns = Columns({
//     handleEdit,
//     handleDelete,
//     handleSeeAllTeachers,
//     handleCheckAssignmnet,
//   });

//   return (
//     <Container className="py-4">
//       {/* Breadcrumb */}
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>{t("checkAssignments")}</Breadcrumb.Item>
//           </Breadcrumb>
//         </Col>
//       </Row>

//       {/* Back Button */}
//       <Row className="mb-2">
//         <Col>
//           <Button
//             className="back_button"
//             style={{ borderRadius: 20, fontWeight: 500 }}
//             variant="secondary"
//             onClick={() => navigate(-1)}
//           >
//             &larr; {t("back")}
//           </Button>
//         </Col>
//       </Row>

//       {/* Header + Enroll Button */}
//       <Row className="align-items-center mb-4">
//         <Col xs={6}>
//           <h3 className="mb-0 fw-semibold name_heading">
//             {t("checkAssignments")}
//           </h3>
//         </Col>
//         <Col xs={6} className="text-end">
//           {blogs.length === 0 && (
//             <Button
//               onClick={() => navigate("/dashboard/teacher_enroll/create")}
//               className="blinking-button rounded-pill"
//               variant="primary"
//             >
//               <IoMdAdd className="me-2" size={18} />
//               {t("enrollNow")}
//             </Button>
//           )}
//         </Col>
//       </Row>

//       {/* Table */}
//       <Row>
//         <Col>
//           <DataTable
//             columns={columns}
//             data={filteredItems}
//             pagination
//             paginationResetDefaultPage={resetPaginationToggle}
//             highlightOnHover
//             pointerOnHover
//             responsive
//           />
//         </Col>
//       </Row>

//       {/* Delete Confirmation Modal */}
//       <Modal show={open} onHide={() => setOpen(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>{t("confirmDeletion")}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>{t("deleteBlogPrompt")}</Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setOpen(false)}>
//             {t("cancel")}
//           </Button>
//           <Button variant="danger" onClick={DeleteBlog}>
//             {t("yesDelete")}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// }
