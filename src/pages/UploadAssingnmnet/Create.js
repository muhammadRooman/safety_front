// import React, { useEffect, useState } from "react";
// import {
//   Form,
//   Button,
//   Col,
//   Row,
//   Alert,
//   Card,
//   Container,
//   Breadcrumb,
// } from "react-bootstrap";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as Yup from "yup";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// // Validation schema
// const validationSchema = Yup.object({
//   title: Yup.string().required("Title is required"),
//   subject: Yup.string().required("Subject is required"),
//   description: Yup.string().required("Description is required"),
//   teacher: Yup.string().required("Select a teacher"),
//   image: Yup.mixed()
//     .nullable()
//     .test("fileSize", "Image size exceeds 5MB", (value) => !value || value.size <= 5 * 1024 * 1024)
//     .test("fileType", "Only JPEG, PNG, or GIF allowed", (value) =>
//       !value || ["image/jpeg", "image/png", "image/gif"].includes(value.type)
//     ),
//   pdf: Yup.mixed()
//     .nullable()
//     .test("fileSize", "File size exceeds 10MB", (value) => !value || value.size <= 10 * 1024 * 1024)
//     .test("fileType", "Only PDF, DOC, or DOCX allowed", (value) =>
//       !value || [
//         "application/pdf",
//         "application/msword",
//         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       ].includes(value.type)
//     ),
// }).test("at-least-one-checkbox", "At least one checkbox (Image or PDF) must be checked", function (value) {
//   const { enableImage, enablePdf } = this.options.context;
//   return enableImage || enablePdf;
// });

// const Create = () => {
//   const { t } = useTranslation();
//   const [enableImage, setEnableImage] = useState(false);
//   const [enablePdf, setEnablePdf] = useState(false);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [fileName, setFileName] = useState("");
//   const [teachersList, setTeachersList] = useState([]);
//   const navigate = useNavigate();
//   const token = useSelector((state) => state.auth.token);
//   const id = useSelector((state) => state.auth.id);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm({
//     resolver: yupResolver(validationSchema),
//     context: { enableImage, enablePdf },
//   });

//   useEffect(() => {
//     if (!token || !id) {
//       toast.error(t("loginToSubmit"));
//       navigate("/login");
//     }
//   }, [token, id, navigate, t]);

//   useEffect(() => {
//     const fetchTeachers = async () => {
//       try {
//         const response = await axios.get("http://localhost:8082/api/admin/enrollTeacher", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setTeachersList(response.data);
//       } catch (error) {
//         toast.error(t("failedToFetchTeachers"));
//         console.error("Fetch error:", error);
//       }
//     };
//     if (token) fetchTeachers();
//   }, [token, t]);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) return toast.error(t("imageSizeError"));
//       if (!["image/jpeg", "image/png", "image/gif"].includes(file.type))
//         return toast.error(t("invalidImageType"));
//       setValue("image", file);
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result);
//       reader.readAsDataURL(file);
//     } else {
//       setValue("image", null);
//       setImagePreview(null);
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 10 * 1024 * 1024) return toast.error(t("pdfSizeError"));
//       if (
//         !["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)
//       ) {
//         return toast.error(t("invalidPdfType"));
//       }
//       setValue("pdf", file);
//       setFileName(file.name);
//     } else {
//       setValue("pdf", null);
//       setFileName("");
//     }
//   };

//   const onSubmit = async (data) => {
//     try {
//       const formData = new FormData();
//       formData.append("title", data.title);
//       formData.append("description", data.description);
//       formData.append("subject", data.subject);
//       formData.append("teacher", data.teacher);
//       formData.append("student", id);
//       if (data.image) formData.append("image", data.image);
//       if (data.pdf) formData.append("pdf", data.pdf);

//       await axios.post("http://localhost:8082/api/admin/submit", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       toast.success(t("success"));
//       navigate("/dashboard/assignment");
//     } catch (err) {
//       toast.error(err.response?.data?.message || t("submitError"));
//       console.error("Submit error:", err.response?.data);
//     }
//   };

//   const onError = () => {
//     toast.error(t("fillRequiredFields"));
//   };

//   return (
//     <Container className="py-5">
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>{t("uploadAssignment")}</Breadcrumb.Item>
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

//       <Card className="p-4 shadow-lg rounded-4 border-0">
//         <h3 className="text-center mb-4 text-primary fw-bold">
//           📝 {t("uploadAssignment")}
//         </h3>

//         <Form onSubmit={handleSubmit(onSubmit, onError)}>
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="title">
//                 <Form.Label className="fw-semibold">{t("title")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder={t("titlePlaceholder")}
//                   {...register("title")}
//                   isInvalid={!!errors.title}
//                 />
//                 <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="subject">
//                 <Form.Label className="fw-semibold">{t("subject")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder={t("subjectPlaceholder")}
//                   {...register("subject")}
//                   isInvalid={!!errors.subject}
//                 />
//                 <Form.Control.Feedback type="invalid">{errors.subject?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Form.Group controlId="description" className="mb-3">
//             <Form.Label className="fw-semibold">{t("description")}</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={4}
//               placeholder={t("descriptionPlaceholder")}
//               {...register("description")}
//               isInvalid={!!errors.description}
//             />
//             <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
//           </Form.Group>

//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="teacher">
//                 <Form.Label className="fw-semibold">{t("teacher")}</Form.Label>
//                 <Form.Control as="select" {...register("teacher")} isInvalid={!!errors.teacher}>
//                   <option value="">{t("selectTeacher")}</option>
//                   {teachersList.map((teacher) => (
//                     <option key={teacher._id} value={teacher._id}>
//                       {teacher.name}
//                     </option>
//                   ))}
//                 </Form.Control>
//                 <Form.Control.Feedback type="invalid">{errors.teacher?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row className="mb-3">
//             <Col sm={6}>
//               <Form.Check
//                 type="checkbox"
//                 label={t("uploadImage")}
//                 checked={enableImage}
//                 onChange={() => setEnableImage(!enableImage)}
//               />
//             </Col>
//             <Col sm={6}>
//               <Form.Check
//                 type="checkbox"
//                 label={t("uploadPdf")}
//                 checked={enablePdf}
//                 onChange={() => setEnablePdf(!enablePdf)}
//               />
//             </Col>
//           </Row>

//           {enableImage && (
//             <Form.Group controlId="image" className="mb-3">
//               <Form.Label className="fw-semibold">{t("uploadImage")}</Form.Label>
//               <Form.Control
//                 type="file"
//                 onChange={handleImageChange}
//                 accept="image/jpeg,image/png,image/gif"
//                 isInvalid={!!errors.image}
//               />
//               <Form.Control.Feedback type="invalid">{errors.image?.message}</Form.Control.Feedback>
//             </Form.Group>
//           )}

//           {imagePreview && enableImage && (
//             <div className="text-center mb-4">
//               <Card className="mx-auto shadow-sm" style={{ width: "250px" }}>
//                 <Card.Img variant="top" src={imagePreview} />
//                 <Card.Body className="p-2">
//                   <Card.Text className="text-muted small">
//                     {t("imagePreview")}
//                   </Card.Text>
//                 </Card.Body>
//               </Card>
//             </div>
//           )}

//           {enablePdf && (
//             <Form.Group controlId="pdf" className="mb-3">
//               <Form.Label className="fw-semibold">{t("uploadFile")}</Form.Label>
//               <Form.Control
//                 type="file"
//                 onChange={handleFileChange}
//                 accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//                 isInvalid={!!errors.pdf}
//               />
//               <Form.Control.Feedback type="invalid">{errors.pdf?.message}</Form.Control.Feedback>
//               {fileName && <div className="mt-2 text-muted small">{t("selectedFile")}: {fileName}</div>}
//             </Form.Group>
//           )}

//           {errors["at-least-one-file"] && (
//             <Alert variant="danger">{errors["at-least-one-file"].message}</Alert>
//           )}

//           <div className="text-center mt-4">
//             <Button type="submit" variant="primary" className="px-5 py-2 rounded-pill">
//               {t("submit")}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default Create;
