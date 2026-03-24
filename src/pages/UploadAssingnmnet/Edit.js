// import React, { useEffect, useState } from "react";
// import {
//   Form,
//   Button,
//   Col,
//   Row,
//   Card,
//   Container,
//   Spinner,
//   Breadcrumb,
// } from "react-bootstrap";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as Yup from "yup";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useSelector } from "react-redux";
// import { useNavigate, useParams } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// // Yup Schema with English keys only (error messages translated via t())
// const Edit = () => {
//   const { t } = useTranslation();
//   const [teachersList, setTeachersList] = useState([]);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [fileName, setFileName] = useState("");
//   const [isFetching, setIsFetching] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const token = useSelector((state) => state.auth.token);
//   const id = useSelector((state) => state.auth.id);
//   const { id: assignmentId } = useParams();
//   const navigate = useNavigate();

//   const validationSchema = Yup.object({
//     title: Yup.string().required(t("titleRequired")),
//     subject: Yup.string().required(t("subjectRequired")),
//     description: Yup.string().required(t("descriptionRequired")),
//     teacher: Yup.string().required(t("teacherRequired")),
//   });

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm({
//     resolver: yupResolver(validationSchema),
//   });

//   useEffect(() => {
//     if (!token || !id) {
//       toast.error(t("error.unauthorized"));
//       navigate("/login");
//     }
//   }, [token, id, navigate, t]);

//   useEffect(() => {
//     axios
//       .get("http://localhost:8082/api/admin/enrollTeacher", {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then((res) => setTeachersList(res.data))
//       .catch(() => toast.error(t("error.fetchTeachers")));
//   }, [token, t]);

//   useEffect(() => {
//     const fetchAssignment = async () => {
//       try {
//         setIsFetching(true);
//         const res = await axios.get(
//           `http://localhost:8082/api/admin/assignment/${assignmentId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         const data = res.data;
//         setValue("title", data.title);
//         setValue("subject", data.subject);
//         setValue("description", data.description);
//         setValue("teacher", data.teacher?._id || data.teacher);
//         setValue("image", null);
//         setImagePreview(data.image);
//         setFileName(data.pdf);
//       } catch (err) {
//         toast.error(t("error.loadAssignment"));
//       } finally {
//         setIsFetching(false);
//       }
//     };

//     fetchAssignment();
//   }, [assignmentId, setValue, token, t]);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setValue("image", file);
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result);
//       reader.readAsDataURL(file);
//     } else {
//       setImagePreview(null);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setValue("pdf", file);
//       setFileName(file.name);
//     } else {
//       setFileName("");
//     }
//   };

//   const onSubmit = async (data) => {
//     try {
//       setIsSubmitting(true);
//       const formData = new FormData();
//       formData.append("title", data.title);
//       formData.append("description", data.description);
//       formData.append("subject", data.subject);
//       formData.append("teacher", data.teacher);
//       formData.append("student", id);

//       if (data.image) formData.append("image", data.image);
//       if (data.pdf) formData.append("pdf", data.pdf);

//       await axios.patch(
//         `http://localhost:8082/api/admin/updateAssignment/${assignmentId}`,
//         formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       toast.success(t("success.assignmentUpdated"));
//       navigate("/dashboard/assignment");
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || t("error.assignmentUpdateFailed")
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isFetching) {
//     return (
//       <Container className="py-5 text-center">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-3">{t("loading.assignment")}</p>
//       </Container>
//     );
//   }

//   return (
//     <Container className="py-5">
//       <Breadcrumb>
//         <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//           {t("dashboard")}
//         </Breadcrumb.Item>
//         <Breadcrumb.Item active>{t("updateAssignment")}</Breadcrumb.Item>
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

//       <Card className="p-4 shadow">
//         <h3 className="text-center mb-4 text-primary fw-bold">
//           ✏️ {t("updateAssignment")}
//         </h3>

//         <Form onSubmit={handleSubmit(onSubmit)}>
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="title">
//                 <Form.Label>{t("assignmentTitle")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   {...register("title")}
//                   isInvalid={!!errors.title}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.title?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="subject">
//                 <Form.Label>{t("subject")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   {...register("subject")}
//                   isInvalid={!!errors.subject}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.subject?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="description">
//                 <Form.Label>{t("description")}</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   {...register("description")}
//                   isInvalid={!!errors.description}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.description?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="teacher">
//                 <Form.Label>{t("chooseTeacher")}</Form.Label>
//                 <Form.Control
//                   as="select"
//                   {...register("teacher")}
//                   isInvalid={!!errors.teacher}
//                 >
//                   <option value="">{t("selectTeacher")}</option>
//                   {teachersList.map((tch) => (
//                     <option key={tch._id} value={tch._id}>
//                       {tch.name}
//                     </option>
//                   ))}
//                 </Form.Control>
//                 <Form.Control.Feedback type="invalid">
//                   {errors.teacher?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Form.Group controlId="image" className="mb-3">
//             <Form.Label>{t("uploadImage")}</Form.Label>
//             <Form.Control
//               type="file"
//               accept="image/jpeg,image/png,image/gif"
//               onChange={handleImageChange}
//               isInvalid={!!errors.image}
//             />
//             <Form.Control.Feedback type="invalid">
//               {errors.image?.message}
//             </Form.Control.Feedback>
//           </Form.Group>

//           {imagePreview && (
//             <div className="text-center mb-4">
//               <Card className="mx-auto border-0" style={{ width: "250px" }}>
//                 <Card.Img
//                   variant="top"
//                   src={
//                     imagePreview.startsWith("data:")
//                       ? imagePreview
//                       : `http://localhost:8082${imagePreview}`
//                   }
//                 />
//                 <Card.Body className="p-2">
//                   <Card.Text className="text-muted small">
//                     {t("imagePreview")}
//                   </Card.Text>
//                 </Card.Body>
//               </Card>
//             </div>
//           )}

//           <Form.Group controlId="pdf" className="mb-3">
//             <Form.Label>{t("uploadPDF")}</Form.Label>
//             <Form.Control
//               type="file"
//               accept=".pdf,.doc,.docx"
//               onChange={handleFileChange}
//               isInvalid={!!errors.pdf}
//             />
//             <Form.Control.Feedback type="invalid">
//               {errors.pdf?.message}
//             </Form.Control.Feedback>
//             {fileName && (
//               <div className="mt-2 text-muted small">
//                 {t("selectedFile")}: {fileName}
//               </div>
//             )}
//           </Form.Group>

//           {fileName && !fileName.startsWith("data:") && (
//             <div className="mt-2">
//               <a
//                 href={`http://localhost:8082/${fileName.replace(/^\/+/, "")}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="btn btn-outline-secondary btn-sm"
//               >
//                 📄 {t("viewPDF")}
//               </a>
//             </div>
//           )}

//           <div className="text-center">
//             <Button
//               type="submit"
//               variant="primary"
//               className="px-5"
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? t("updating") : t("update")}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default Edit;
