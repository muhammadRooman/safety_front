// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { IoMdAdd } from "react-icons/io";
// import DataTable from "react-data-table-component";
// import axios from "axios";
// import { toast } from "react-toastify";
// import Columns from "./Columns";
// import { useSelector } from "react-redux";
// import {
//   Container,
//   Row,
//   Col,
//   Breadcrumb,
//   Button,
//   Form,
//   Modal,
// } from "react-bootstrap";
// import { useTranslation } from "react-i18next";

// export default function List() {
//   const { t } = useTranslation();
//   const id = useSelector((state) => state.auth.id);
//   const token = useSelector((state) => state.auth.token);
//   const navigate = useNavigate();

//   const [tracker, setTracker] = useState([]);
//   const [filterText, setFilterText] = useState("");
//   const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [delId, setDelId] = useState("");
//   const [user, setUser] = useState(null);

//   const fetchUser = async () => {
//     try {
//       const response = await axios.get(`http://localhost:8082/api/auth/userDetails`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setUser(response.data.user);
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("error_fetching_user"));
//     }
//   };

//   const fetchTrackerData = async (role) => {
//     try {
//       let response;
//       if (role === "student") {
//         response = await axios.get(`http://localhost:8082/api/admin/blog`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else if (role === "teacher") {
//         response = await axios.get(`http://localhost:8082/api/admin/blog/${id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//       setTracker(response.data);
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("error_fetching_tracker"));
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   useEffect(() => {
//     if (user?.role) {
//       fetchTrackerData(user.role);
//     }
//   }, [user]);

//   const filteredItems = tracker.filter((item) =>
//     item.name?.toLowerCase().includes(filterText.toLowerCase())
//   );

//   const handleEdit = (row) => {
//     navigate(`/dashboard/tracker/edit/${row._id}`);
//   };

//   const handleDelete = (row) => {
//     setDelId(row._id);
//     setOpen(true);
//   };

//   const DeleteBlog = async () => {
//     try {
//       const response = await axios.delete(`http://localhost:5000/api/post/${delId}`);
//       if (response.data.success) {
//         toast.success(response.data.message);
//         fetchTrackerData(user.role);
//         setOpen(false);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("delete_failed"));
//     }
//   };

//   const columns = Columns({ handleEdit, handleDelete, user });

//   return (
//     <Container className="py-4">
//       {/* Breadcrumb */}
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>{t("tracker_list")}</Breadcrumb.Item>
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

//       {/* Header & Add Button */}
//       <Row className="align-items-center mb-4">
//         <Col xs={6}>
//           <h3 className="mb-0 fw-semibold name_heading">{t("tracker_list")}</h3>
//         </Col>
//         <Col xs={6} className="text-end">
//           {user?.role === "teacher" && (
//             <Button
//               onClick={() => navigate("/dashboard/tracker/create")}
//               className="rounded-pill"
//               variant="primary"
//             >
//               <IoMdAdd className="me-2" size={18} />
//               {t("add_blog")}
//             </Button>
//           )}
//         </Col>
//       </Row>

//       {/* Search Bar */}
//       <Row className="mb-3">
//         <Col md={6}>
//           <Form.Control
//             type="text"
//             placeholder={t("search_blog_placeholder")}
//             value={filterText}
//             onChange={(e) => {
//               setFilterText(e.target.value);
//               setResetPaginationToggle((prev) => !prev);
//             }}
//           />
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
