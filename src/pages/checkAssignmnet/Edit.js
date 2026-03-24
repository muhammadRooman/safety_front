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

// // Validation Schema
// const validationSchema = Yup.object({
//   name: Yup.string().required("Name is required"),
//   email: Yup.string().email("Invalid email").required("Email is required"),
//   phone: Yup.string().required("Phone is required").matches(/^[0-9]{11}$/, "Phone must be 11 digits"),
//   address: Yup.string().required("Address is required"),
//   image: Yup.mixed().nullable(),
//   title: Yup.string().required("Title is required"),
//   description: Yup.string().required("Description is required"),
// });

// const Edit = () => {
//   const navigate = useNavigate();
//   const { id } = useParams(); // Get ID from URL
//   const token = useSelector((state) => state.auth.token);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm({
//     resolver: yupResolver(validationSchema),
//   });

//   const [imagePreview, setImagePreview] = useState(null);

//   // Fetch existing data
//   useEffect(() => {
//     const fetchStudent = async () => {
//       try {
//         const response = await axios.get(`${ENV.appBaseUrl}/admin/enrollStudent/single/${id}`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const data = response.data;
//         setValue("name", data.name);
//         setValue("email", data.email);
//         setValue("phone", data.phone);
//         setValue("address", data.address);
//         setValue("title", data.title);
//         setValue("description", data.description);
//         setImagePreview(data.image); // Assuming image is a URL
//       } catch (error) {
//         toast.error("Failed to fetch student data");
//       }
//     };

//     fetchStudent();
//   }, [id, token, setValue]);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
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
//       formData.append("title", data.title);
//       formData.append("description", data.description);
//       if (data.image instanceof File) {
//         formData.append("image", data.image);
//       }

//       await axios.patch(`${ENV.appBaseUrl}/admin/enrollStudent/${id}`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       toast.success("Enrollment updated successfully");
//       navigate("/dashboard/students_enroll");
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Error updating student");
//     }
//   };

//   return (
//     <Container className="py-5">
//       {/* Breadcrumb */}
//       <Row>
//         <Col>
//           <Breadcrumb>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
//             <Breadcrumb.Item onClick={() => navigate("/dashboard/students_enroll")}>Assignments List</Breadcrumb.Item>
//             <Breadcrumb.Item active>Edit Enroll Student</Breadcrumb.Item>
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
//         <h3 className="text-center mb-4 text-primary fw-bold">✏️ Edit Enroll Student</h3>

//         <Form onSubmit={handleSubmit(onSubmit)}>
//           {/* Premium Title Field */}
//           <Row className="mb-3">
//             <Col>
//               <Card className="shadow-sm border-0 mb-2">
//                 <Card.Body>
//                   <Form.Group controlId="title">
//                     <Form.Label className="fw-bold fs-5">Title</Form.Label>
//                     <Form.Control
//                       type="text"
//                       placeholder="Enter assignment title"
//                       {...register("title")}
//                       isInvalid={!!errors.title}
//                       className="py-2 px-3 rounded-pill border-primary"
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {errors.title?.message}
//                     </Form.Control.Feedback>
//                   </Form.Group>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//           {/* Premium Description Field */}
//           <Row className="mb-3">
//             <Col>
//               <Card className="shadow-sm border-0 mb-2">
//                 <Card.Body>
//                   <Form.Group controlId="description">
//                     <Form.Label className="fw-bold fs-5">Description</Form.Label>
//                     <Form.Control
//                       as="textarea"
//                       rows={3}
//                       placeholder="Enter description"
//                       {...register("description")}
//                       isInvalid={!!errors.description}
//                       className="py-2 px-3 rounded-4 border-primary"
//                     />
//                     <Form.Control.Feedback type="invalid">
//                       {errors.description?.message}
//                     </Form.Control.Feedback>
//                   </Form.Group>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//           <Row className="mb-3">
//             <Col md={6}>
//               <Form.Group controlId="name">
//                 <Form.Label>Name</Form.Label>
//                 <Form.Control
//                   type="text"
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
//                 <Form.Label>Address</Form.Label>
//                 <Form.Control
//                   as="textarea"
//                   rows={2}
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
//                 <Card.Img
//                   variant="top"
//                   src={
//                     imagePreview.startsWith("data:")
//                       ? imagePreview 
//                       : `http://localhost:8082/uploads/${imagePreview}` 
//                   }
//                 />
//                 <Card.Body className="p-2">
//                   <Card.Text className="text-muted small">Image Preview</Card.Text>
//                 </Card.Body>
//               </Card>
//             </div>
//           )}

//           <div className="text-center">
//             <Button type="submit" variant="success" className="px-5 py-2">
//               Update
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default Edit;
