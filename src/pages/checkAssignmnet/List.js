// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { IoMdAdd } from "react-icons/io";
// import DataTable from "react-data-table-component";
// import axios from "axios";
// import { toast } from "react-toastify";
// import Columns from "./Columns";
// import { useSelector } from "react-redux";
// import { Container, Row, Col, Button, Form, Modal, Card, Breadcrumb } from "react-bootstrap";
// import { CSVLink } from "react-csv";
// import { useTranslation } from "react-i18next";

// export default function BlogList() {
//   const { id } = useParams();
//   const token = useSelector((state) => state.auth.token);
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   const [blogs, setBlogs] = useState([]);
//   const [filterText, setFilterText] = useState("");
//   const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [delId, setDelId] = useState("");

//   const fetchBlogs = async () => {
//     try {
//       const response = await axios.get(
//         `http://localhost:8082/api/admin/assignments/teacher/${id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (response?.data) {
//         setBlogs(response.data);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("errorFetchingBlogs"));
//     }
//   };

//   useEffect(() => {
//     fetchBlogs();
//   }, []);

//   const filteredItems = blogs.filter((item) =>
//     item.title?.toLowerCase().includes(filterText.toLowerCase())
//   );

//   const handleEdit = (row) => {
//     navigate(`/dashboard/students_enroll/${row._id}`);
//   };

//   const handleDelete = (row) => {
//     setDelId(row._id);
//     setOpen(true);
//   };

//   const DeleteBlog = async () => {
//     try {
//       const response = await axios.delete(
//         `http://localhost:8082/api/admin/enrollStudent/${delId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (response.data) {
//         toast.success(response.data.message);
//         fetchBlogs();
//         setOpen(false);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("deleteFailed"));
//     }
//   };

//   const columns = Columns({ handleEdit, handleDelete, fetchBlogs });

//   const csvHeaders = [
//     { label: t("studentName"), key: "studentName" },
//     { label: t("studentEmail"), key: "studentEmail" },
//     { label: t("subject"), key: "subject" },
//     { label: t("teacherName"), key: "teacherName" },
//     { label: t("marks"), key: "marks" },
//     { label: t("outofMarks"), key: "outofMarks" },
//   ];

//   const csvData = filteredItems.map((item) => ({
//     studentName: item.student?.name || t("na"),
//     studentEmail: item.student?.email || t("na"),
//     subject: item.subject || t("pending"),
//     teacherName: item.teacher?.name || t("na"),
//     marks: item.marks ?? t("pending"),
//     outofMarks: item.outofMarks ?? t("pending"),
//   }));

//   return (
//     <Container className="py-4">
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>{t("assignmentsList")}</Breadcrumb.Item>
//           </Breadcrumb>
//         </Col>
//       </Row>

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

//       <Row className="align-items-center mb-4">
//         <Col>
//           <h2 className="mb-0 fw-semibold name_heading">
//             {t("assignmentsList")}
//           </h2>
//         </Col>
//         <Col xs="auto">
//           <CSVLink
//             headers={csvHeaders}
//             data={csvData}
//             filename={`assignments_list_${Date.now()}.csv`}
//             className="btn btn-success"
//             style={{ borderRadius: 20, fontWeight: 500 }}
//           >
//             {t("downloadCSV")}
//           </CSVLink>
//         </Col>
//       </Row>

//       <Row className="mb-3">
//         <Col xs={12} md={4}>
//           <Form.Control
//             type="text"
//             placeholder={t("searchByTitle")}
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
//           />
//         </Card.Body>
//       </Card>

//       <Modal show={open} onHide={() => setOpen(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>{t("deleteStudent")}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>{t("confirmDeleteStudent")}</Modal.Body>
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
