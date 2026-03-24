// import React, { useState, useEffect } from "react";
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
// import { ENV } from "../../config/config";
// import { toast } from "react-toastify";
// import { useSelector } from "react-redux";
// import { useNavigate, useParams } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// // Validation schema (unchanged)
// const validationSchema = Yup.object({
//   name: Yup.string().required("Name is required"),
//   email: Yup.string().email("Invalid email format").required("Email is required"),
//   phone: Yup.string().required("Phone is required").matches(/^[0-9]{11}$/, "Phone number must be 11 digits"),
//   address: Yup.string().required("Address is required"),
//   description: Yup.string().required("Description is required"),
// });

// const Edit = () => {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { id: userId, token } = useSelector((state) => state.auth);
//   const { id: blogId } = useParams();
//   const isEditMode = Boolean(blogId);
//   const [blogData, setBlogData] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm({
//     resolver: yupResolver(validationSchema),
//   });

//   useEffect(() => {
//     const fetchBlogData = async () => {
//       if (isEditMode) {
//         try {
//           const res = await axios.get(`${ENV.appBaseUrl}/admin/blog/edit/${blogId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           setBlogData(res.data);
//           setImagePreview(res.data.image);
//         } catch (error) {
//           toast.error(t("errors.fetchBlog"));
//         }
//       }
//     };

//     fetchBlogData();
//   }, [blogId, isEditMode, token, t]);

//   useEffect(() => {
//     if (blogData) {
//       setValue("name", blogData.name || "");
//       setValue("email", blogData.email || "");
//       setValue("phone", blogData.phone || "");
//       setValue("address", blogData.address || "");
//       setValue("description", blogData.description || "");

//       if (blogData.image) {
//         setImagePreview(`http://localhost:8082/uploads/${blogData.image}`);
//       }
//     }
//   }, [blogData, setValue]);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error(t("errors.fileSize"));
//         return;
//       }
//       if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
//         toast.error(t("errors.fileType"));
//         return;
//       }
//       setValue("image", file);
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result);
//       reader.readAsDataURL(file);
//     }
//   };

//   const onSubmit = async (data) => {
//     try {
//       const formData = new FormData();
//       formData.append("name", data.name);
//       formData.append("email", data.email);
//       formData.append("phone", data.phone);
//       formData.append("address", data.address);
//       formData.append("description", data.description);
//       formData.append("userId", userId);
//       if (data.image) formData.append("image", data.image);

//       const config = {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       };

//       if (isEditMode) {
//         await axios.patch(`${ENV.appBaseUrl}/admin/blog/${blogId}`, formData, config);
//         toast.success(t("messages.blogUpdated"));
//         setSuccessMessage(t("messages.blogUpdated"));
//       } else {
//         await axios.post(`${ENV.appBaseUrl}/admin/blog`, formData, config);
//         toast.success(t("messages.blogCreated"));
//         setSuccessMessage(t("messages.blogCreated"));
//       }

//       navigate("/dashboard/tracker");
//     } catch (err) {
//       const message = err.response?.data?.message || t("errors.submit");
//       toast.error(message);
//       setErrorMessage(message);
//     }
//   };

//   return (
//     <Container className="py-4">
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>
//               {isEditMode ? t("title") : t("create.title")}
//             </Breadcrumb.Item>
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

//       <Card className="shadow-lg p-4">
//         <h3 className="text-center mb-4 text-primary fw-bold">
//           {isEditMode ? t("heading") : t("create.heading")}
//         </h3>

//         {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
//         {successMessage && <Alert variant="success">{successMessage}</Alert>}

//         <Form onSubmit={handleSubmit(onSubmit)}>
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="name">
//                 <Form.Label>{t("name")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   {...register("name")}
//                   placeholder={t("enterName")}
//                   isInvalid={!!errors.name}
//                 />
//                 <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="email">
//                 <Form.Label>{t("email")}</Form.Label>
//                 <Form.Control
//                   type="email"
//                   {...register("email")}
//                   placeholder={t("enterEmail")}
//                   isInvalid={!!errors.email}
//                 />
//                 <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="phone">
//                 <Form.Label>{t("phone")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   {...register("phone")}
//                   placeholder={t("enterPhone")}
//                   isInvalid={!!errors.phone}
//                 />
//                 <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="address">
//                 <Form.Label>{t("address")}</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={2}
//                   {...register("address")}
//                   placeholder={t("enterAddress")}
//                   isInvalid={!!errors.address}
//                 />
//                 <Form.Control.Feedback type="invalid">{errors.address?.message}</Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Form.Group controlId="description" className="mb-3">
//             <Form.Label>{t("description")}</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               {...register("description")}
//               placeholder={t("enterDescription")}
//               isInvalid={!!errors.description}
//             />
//             <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
//           </Form.Group>

//           <Form.Group controlId="image" className="mb-3">
//             <Form.Label>
//               {isEditMode ? t("changeImage") : t("uploadImage")}
//             </Form.Label>
//             <Form.Control
//               type="file"
//               accept="image/jpeg,image/png,image/gif"
//               onChange={handleImageChange}
//             />
//           </Form.Group>

//           {imagePreview && (
//             <div className="text-center my-3">
//               <Card className="mx-auto" style={{ width: "18rem" }}>
//                 <Card.Img variant="top" src={imagePreview} alt="Preview" />
//               </Card>
//             </div>
//           )}

//           <div className="text-center">
//             <Button type="submit" variant="primary" className="mt-3 px-5">
//               {isEditMode ? t("button") : t("create")}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default Edit;
