// import React, { useState } from "react";
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
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// // Yup validation schema
// const validationSchema = Yup.object({
//   name: Yup.string().required("Name is required"),
//   email: Yup.string()
//     .email("Invalid email format")
//     .required("Email is required"),
//   phone: Yup.string()
//     .required("Phone is required")
//     .matches(/^[0-9]{11}$/, "Phone number must be 11 digits"),
//   address: Yup.string().required("Address is required"),
//   description: Yup.string().required("Description is required"),
// });

// const Create = () => {
//   const { t } = useTranslation();
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
//   });

//   const [imagePreview, setImagePreview] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

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
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     } else {
//       setValue("image", null);
//       setImagePreview(null);
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
//       formData.append("userId", id);
//       if (data.image) {
//         formData.append("image", data.image);
//       }

//       await axios.post(`${ENV.appBaseUrl}/admin/blog`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       setSuccessMessage(t("messages.blogCreated"));
//       toast.success(t("messages.blogCreated"));
//       navigate("/dashboard/tracker");
//     } catch (err) {
//       const msg = err.response?.data?.message || t("errors.submit");
//       setErrorMessage(msg);
//       toast.error(msg);
//     }
//   };

//   return (
//     <Container className="py-4">
//       {/* Breadcrumb */}
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
//               {t("dashboard")}
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>{t("title")}</Breadcrumb.Item>
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

//       <Card className="shadow-lg p-4">
//         <h3 className="text-center mb-4 text-primary fw-bold">
//           {t("Create_Tracker_Item")}
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
//                   placeholder={t("enterName")}
//                   {...register("name")}
//                   isInvalid={!!errors.name}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.name?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="email">
//                 <Form.Label>{t("email")}</Form.Label>
//                 <Form.Control
//                   type="email"
//                   placeholder={t("enterEmail")}
//                   {...register("email")}
//                   isInvalid={!!errors.email}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.email?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="phone">
//                 <Form.Label>{t("phone")}</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder={t("enterPhone")}
//                   {...register("phone")}
//                   isInvalid={!!errors.phone}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.phone?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group controlId="address">
//                 <Form.Label>{t("address")}</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={2}
//                   placeholder={t("enterAddress")}
//                   {...register("address")}
//                   isInvalid={!!errors.address}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.address?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Form.Group controlId="description" className="mb-3">
//             <Form.Label>{t("description")}</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               placeholder={t("enterDescription")}
//               {...register("description")}
//               isInvalid={!!errors.description}
//             />
//             <Form.Control.Feedback type="invalid">
//               {errors.description?.message}
//             </Form.Control.Feedback>
//           </Form.Group>

//           <Form.Group controlId="image" className="mb-3">
//             <Form.Label>{t("uploadImage")}</Form.Label>
//             <Form.Control
//               type="file"
//               onChange={handleImageChange}
//               accept="image/jpeg,image/png,image/gif"
//               isInvalid={!!errors.image}
//             />
//             <Form.Control.Feedback type="invalid">
//               {errors.image?.message}
//             </Form.Control.Feedback>
//           </Form.Group>

//           {imagePreview && (
//             <div className="text-center my-3">
//               <Card className="mx-auto" style={{ width: "18rem" }}>
//                 <Card.Img variant="top" src={imagePreview} alt="Preview" />
//                 <Card.Body>
//                   <Card.Text>{t("preview") || "Image Preview"}</Card.Text>
//                 </Card.Body>
//               </Card>
//             </div>
//           )}

//           <div className="text-center">
//             <Button type="submit" variant="primary" className="mt-3 px-5">
//               {t("button")}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default Create;
