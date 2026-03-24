// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { IoMdAdd } from "react-icons/io";
// import DataTable from "react-data-table-component";
// import axios from "axios";
// import { toast } from "react-toastify";
// import Columns from "./Columns";
// import { useSelector } from "react-redux";
// import {
//   Breadcrumb,
//   Button,
//   Container,
//   Row,
//   Col,
//   Card,
//   Form,
//   Modal,
// } from "react-bootstrap";
// import { CSVLink } from "react-csv";
// import { useTranslation } from "react-i18next";
// import { Multiselect } from "multiselect-react-dropdown";

// export default function StudentEnrollList() {
//   const { t } = useTranslation();
//   const id = useSelector((state) => state.auth.id);
//   const token = useSelector((state) => state.auth.token);
//   const { userId } = useParams();
//   const navigate = useNavigate();

//   const [blogs, setBlogs] = useState([]);
//   const [filterText, setFilterText] = useState("");
//   const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [delId, setDelId] = useState("");
//   const [cSVHide, setCSVHide] = useState(false);
//   const [user, setUser] = useState(null);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [newStudent, setNewStudent] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     subject: [],
//     password: "",
//   });
//   const subjectOptions = [
//     "Math",
//     "English",
//     "Science",
//     "Computer",
//     "Physics",
//     "Chemistry"
//   ];
  
//   const fetchUser = async () => {
//     try {
//       const response = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setUser(response.data.user);
//     } catch (err) {
//       toast.error(t("error_fetching_user"));
//     }
//   };

//   const fetchBlogs = async (role) => {
//     try {
//       let response;
//       if (role === "student") {
//         response = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/admin/enrollStudent/${id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setCSVHide(false);
//       } else if (role === "teacher") {
//         response = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setCSVHide(true);
//       }

//       if (response) {
//         setBlogs(response.data.users);
//         console.log("response",response.data.users);
//       }
//     } catch (err) {
//       toast.error(t("error_fetching_students"));
//       setCSVHide(false);
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   useEffect(() => {
//     if (user?.role ) {
//       fetchBlogs(user?.role);
//     }
//   }, [user]);

//   const filteredItems = blogs.filter((item) =>
//     item.name?.toLowerCase().includes(filterText.toLowerCase())
//   );

//   const handleEdit = (row) => {
//     console.log("row",row);
//     // navigate(`/dashboard/students_enroll/${row._id}`);
//     navigate(`/dashboard/students_enroll/${row._id}`);
//   };

//   const handleDelete = (row) => {
//     setDelId(row._id);
//     setOpen(true);
//   };

//   const DeleteBlog = async () => {
//     try {
//       const response = await axios.delete(
//         `${process.env.REACT_APP_BASE_ADMIN_API}/admin/enrollStudent/${delId}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       if (response.data) {
//         toast.success(response.data.message);
//         setBlogs((prev) => prev.filter((b) => b._id !== delId));
//         setOpen(false);
//       }
//     } catch (err) {
//       toast.error(t("delete_failed"));
//     }
//   };

//   const handleAddStudentChange = (e) => {
//     const { name, value } = e.target;
//     setNewStudent((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleAddStudentSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_BASE_ADMIN_API}/auth/signup`,
//         newStudent,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (response.data) {
//         toast.success(t("student_created_successfully") || "Student created successfully");
//         setBlogs((prev) => [response.data, ...prev]);
//         setShowAddModal(false);
//         setNewStudent({
//           name: "",
//           email: "",
//           phone: "",
//           subject: "",
//           password: "",
//         });
//       }
//     } catch (err) {
//       toast.error(t("student_create_failed") || "Failed to create student");
//     }
//   };

//   const columns = Columns({ handleEdit, handleDelete });

//   const csvHeaders = [
//     { label: t("name"), key: "name" },
//     { label: t("email"), key: "email" },
//     { label: t("phone"), key: "phone" },
//     { label: t("address"), key: "address" },
//     { label: t("subject"), key: "subject" },
//     { label: t("created_at"), key: "createdAt" },
//   ];

//   const csvData = filteredItems.map((item) => ({
//     name: item.name || "N/A",
//     email: item.email || "N/A",
//     phone: item.phone || "N/A",
//     address: item.address || "N/A",
//     subject: item.subject || "N/A",
//     createdAt: new Date(item.createdAt).toLocaleDateString(),
//   }));

//   return (
//     <Container className="py-4">
//       <Breadcrumb>
//         <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//           {t("dashboard")}
//         </Breadcrumb.Item>
//         <Breadcrumb.Item active>
//           {cSVHide ? t("students_enroll_list") : t("student_enroll")}
//         </Breadcrumb.Item>
//       </Breadcrumb>

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

//       <Row className="mb-4 align-items-center justify-content-between">
//         <Col xs={6}>
//           <h3 className="mb-0 fw-semibold name_heading">
//             {cSVHide ? t("students_enroll_list") : t("student_enroll_my_detail")}
//           </h3>
//         </Col>
//         <Col md="auto" className="d-flex gap-2">
//           {(
//             <Button
//               onClick={() => setShowAddModal(true)}
//               variant="primary"
//             >
//               <IoMdAdd size={25} className="me-1" />
//               {t("enroll_student")}
//             </Button>
//           )}
//           {filteredItems.length > 0 && cSVHide && (
//             <CSVLink
//               data={csvData}
//               headers={csvHeaders}
//               filename={`students_enroll_${Date.now()}.csv`}
//               className="btn btn-success"
//               style={{ borderRadius: 20, fontWeight: 500 }}
//             >
//               {t("download_csv")}
//             </CSVLink>
//           )}
//         </Col>
//       </Row>

//       {cSVHide && (
//         <Row className="mb-3">
//           <Col md={4}>
//             <Form.Control
//               type="text"
//               placeholder={t("search_by_name")}
//               value={filterText}
//               onChange={(e) => setFilterText(e.target.value)}
//             />
//           </Col>
//         </Row>
//       )}

//       <Card>
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
//           <Modal.Title>{t("confirm_delete")}</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>{t("delete_question_student")}</Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setOpen(false)}>
//             {t("cancel")}
//           </Button>
//           <Button variant="danger" onClick={DeleteBlog}>
//             {t("yes_delete")}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
//         <Form onSubmit={handleAddStudentSubmit}>
//           <Modal.Header closeButton>
//             <Modal.Title>{t("add_student") || "Add Student"}</Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             <Form.Group className="mb-3">
//               <Form.Label>{t("name") || "Name"}</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="name"
//                 value={newStudent.name}
//                 onChange={handleAddStudentChange}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>{t("email") || "Email"}</Form.Label>
//               <Form.Control
//                 type="email"
//                 name="email"
//                 value={newStudent.email}
//                 onChange={handleAddStudentChange}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>{t("phone") || "Phone"}</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="phone"
//                 value={newStudent.phone}
//                 onChange={handleAddStudentChange}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//   <Form.Label>{t("subject") || "Subject / Course"}</Form.Label>

//   <Form.Select
//     multiple
//     name="subject"
//     value={newStudent.subject}
//     onChange={(e) => {
//       const values = Array.from(
//         e.target.selectedOptions,
//         (option) => option.value
//       );

//       setNewStudent((prev) => ({
//         ...prev,
//         subject: values,
//       }));
//     }}
//     required
//   >
//     {subjectOptions.map((sub, index) => (
//       <option key={index} value={sub}>
//         {sub}
//       </option>
//     ))}
//   </Form.Select>
// </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>{t("password") || "Password"}</Form.Label>
//               <Form.Control
//                 type="password"
//                 name="password"
//                 value={newStudent.password}
//                 onChange={handleAddStudentChange}
//                 required
//               />
//             </Form.Group>
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="secondary" onClick={() => setShowAddModal(false)}>
//               {t("cancel")}
//             </Button>
//             <Button type="submit" variant="primary">
//               {t("save") || "Save"}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>
//     </Container>
//   );
// }
