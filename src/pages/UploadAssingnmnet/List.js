// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { IoMdAdd } from "react-icons/io";
// import DataTable from "react-data-table-component";
// import axios from "axios";
// import { toast } from "react-toastify";
// import Columns from "./Columns";
// import { useSelector } from "react-redux";
// import { useTranslation } from "react-i18next";
// import {
//   Container,
//   Card,
//   Row,
//   Col,
//   Button,
//   Form,
//   Modal,
//   Breadcrumb,
// } from "react-bootstrap";

// export default function BlogList() {
//   const { t } = useTranslation();
//   const [filterText, setFilterText] = useState("");
//   const id = useSelector((state) => state.auth.id);
//   const token = useSelector((state) => state.auth.token);
//   const { userId } = useParams();
//   const navigate = useNavigate();

//   const [blogs, setBlogs] = useState([]);
//   const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [delId, setDelId] = useState("");
//   const [user, setUser] = useState(null);

//   const fetchUser = async () => {
//     try {
//       const response = await axios.get(
//         `http://localhost:8082/api/auth/userDetails`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       setUser(response.data.user);
//     } catch (err) {
//       toast.error(t("error_fetching_user"));
//     }
//   };

//   const fetchBlogs = async (role) => {
//     try {
//       let response;
//       if (role === "student") {
//         response = await axios.get(
//           `http://localhost:8082/api/admin/students/${id}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//       } else if (role === "teacher") {
//         response = await axios.get(`http://localhost:8082/api/admin/teacher`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//       if (response) setBlogs(response.data.reverse());
//     } catch (err) {
//       toast.error(t("error_fetching_tracker"));
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   useEffect(() => {
//     if (user?.role) {
//       fetchBlogs(user.role);
//     }
//   }, [user]);

//   const handleEdit = (row) => {
//     navigate(`/dashboard/assignment/${row._id}`);
//   };

//   const handleDelete = (row) => {
//     setDelId(row._id);
//     setOpen(true);
//   };

//   const DeleteBlog = async () => {
//     try {
//       const response = await axios.delete(
//         `http://localhost:8082/api/admin/students/${delId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (response.data) {
//         toast.success(response.data.message);
//         setBlogs((prev) => prev.filter((b) => b._id !== delId));
//         setOpen(false);
//         setDelId("");
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("delete_failed"));
//     }
//   };

//   const columns = Columns({ handleEdit, handleDelete });

//   const filteredItems = blogs.filter((item) => {
//     const searchText = filterText.toLowerCase().trim();
//     if (!searchText) return true;
//     return item.title?.toLowerCase().includes(searchText);
//   });

//   return (
//     <Container className="py-4">
//       <Row className="mb-3">
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>
//               {t("uploadAssignment") || "Assignment Record List"}
//             </Breadcrumb.Item>
//           </Breadcrumb>
//         </Col>
//       </Row>

//       <Row className="mb-2">
//         <Col>
//           <Button
//             variant="secondary"
//             className="back_button"
//             style={{ borderRadius: 20, fontWeight: 500 }}
//             onClick={() => navigate(-1)}
//           >
//             &larr; {t("back")}
//           </Button>
//         </Col>
//       </Row>

//       <Row className="align-items-center mb-4">
//         <Col xs={12} md={6}>
//           <h3 className="mb-0 fw-semibold name_heading">
//             {t("uploadAssignment") || "Assignment Record List"}
//           </h3>
//         </Col>
//         <Col xs={12} md={6} className="text-md-end mt-3 mt-md-0">
//           <Button
//             onClick={() => navigate("/dashboard/assignment/create")}
//             className="rounded-pill"
//             variant="primary"
//           >
//             <IoMdAdd className="me-2" size={25} />
//             {t("uploadAssignment") || "Add Assignment"}
//           </Button>
//         </Col>
//       </Row>

//       <Row className="mb-3">
//         <Col md={4}>
//           <Form.Control
//             type="text"
//             placeholder={t("search_blog_placeholder")}
//             value={filterText}
//             onChange={(e) => setFilterText(e.target.value)}
//           />
//         </Col>
//       </Row>

//       <Card className="shadow-sm">
//         <Card.Body>
//           <DataTable
//             columns={columns}
//             data={filteredItems}
//             pagination
//             paginationResetDefaultPage={resetPaginationToggle}
//             highlightOnHover
//             pointerOnHover
//             responsive
//             striped
//             noHeader
//           />
//         </Card.Body>
//       </Card>

//       {/* Delete Modal */}
//       <Modal show={open} onHide={() => setOpen(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>{t("confirm_delete")}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>{t("delete_question")}</Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setOpen(false)}>
//             {t("cancel")}
//           </Button>
//           <Button variant="danger" onClick={DeleteBlog}>
//             {t("yes_delete")}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// }
