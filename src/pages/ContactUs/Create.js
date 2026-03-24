// import React, { useState } from "react";
// import {
//   Form,
//   Button,
//   Col,
//   Row,
//   Alert,
//   Card,
//   Image,
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

// // Validation Schema
// const validationSchema = Yup.object({
//   name: Yup.string().required("Name is required"),
//   email: Yup.string()
//     .email("Invalid email format")
//     .required("Email is required"),
//   phone: Yup.string()
//     .required("Phone is required")
//     .matches(/^[0-9]{11}$/, "Phone number must be 11 digits"),
//   address: Yup.string().required("Address is required"),
//   subject: Yup.string().required("Subject is required"),
//   teachers: Yup.array().min(1, "Select at least one teacher"),
//   image: Yup.mixed()
//     .required("Image is required")
//     .test(
//       "fileSize",
//       "File size is too large",
//       (value) => value && value.size <= 5 * 1024 * 1024
//     )
//     .test(
//       "fileType",
//       "Unsupported file format",
//       (value) =>
//         value && ["image/jpeg", "image/png", "image/gif"].includes(value.type)
//     ),
// });

// const Create = () => {
//   const navigate = useNavigate();
//   const token = useSelector((state) => state.auth.token);
//   const id = useSelector((state) => state.auth.id);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm({ resolver: yupResolver(validationSchema) });

//   const [imagePreview, setImagePreview] = useState(null);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5 * 1024 * 1024)
//         return toast.error("File size exceeds 5MB");
//       if (!["image/jpeg", "image/png", "image/gif"].includes(file.type))
//         return toast.error("Only JPEG, PNG, or GIF files are allowed");

//       setValue("image", file);
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result);
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
//       formData.append("subject", data.subject);
//         formData.append("userId", id);
//       if (data.image) formData.append("image", data.image);

//       await axios.post(`${ENV.appBaseUrl}/admin/enrollStudent`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       toast.success("Enrollment submitted successfully");
//       navigate("/dashboard/students_enroll");
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Error submitting form");
//     }
//   };

//   return (
//     <Container className="py-5">
//       {/* Breadcrumb */}
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard/students_enroll")}>Students Enroll List</Breadcrumb.Item>
//             <Breadcrumb.Item active>Enroll Student</Breadcrumb.Item>
//           </Breadcrumb>
//         </Col>
//       </Row>
//       {/* Back Button */}
//       <Row className="mb-2">
//         <Col>
//           <Button className="back_button" style={{ borderRadius: 20, fontWeight: 500 }} variant="secondary" onClick={() => navigate(-1)}>
//             &larr; Back
//           </Button>
//         </Col>
//       </Row>
//       <Card className="p-4 shadow">
//         <h3 className="text-center mb-4 text-primary fw-bold">📝 Enroll Student</h3>

//         {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
//         {successMessage && <Alert variant="success">{successMessage}</Alert>}

//         <Form onSubmit={handleSubmit(onSubmit)}>
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="name">
//                 <Form.Label>Name</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter your name"
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
//                 <Form.Label>Email</Form.Label>
//                 <Form.Control
//                   type="email"
//                   placeholder="Enter your email"
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
//                 <Form.Label>Phone</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter 11-digit phone number"
//                   {...register("phone")}
//                   isInvalid={!!errors.phone}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.phone?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>
//     <Col md={6}>
//               <Form.Group controlId="subject">
//                 <Form.Label>Subject</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter subject"
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
            
//                <Col md={6}>
//               <Form.Group controlId="address">
//                 <Form.Label>Address</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={2}
//                   placeholder="Enter address"
//                   {...register("address")}
//                   isInvalid={!!errors.address}
//                 />
//                 <Form.Control.Feedback type="invalid">
//                   {errors.address?.message}
//                 </Form.Control.Feedback>
//               </Form.Group>
//             </Col>
          
//           </Row>

  

//           <Form.Group controlId="image" className="mb-3">
//             <Form.Label>Upload Image</Form.Label>
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
//             <div className="text-center mb-4">
//               <Card className="mx-auto border-0" style={{ width: "250px" }}>
//                 <Card.Img variant="top" src={imagePreview} />
//                 <Card.Body className="p-2">
//                   <Card.Text className="text-muted small">
//                     Image Preview
//                   </Card.Text>
//                 </Card.Body>
//               </Card>
//             </div>
//           )}

//           <div className="text-center">
//             <Button type="submit" variant="primary" className="px-5 py-2">
//               Submit
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default Create;
