// import React, { useState } from "react";
// import { Form, Button, Col, Row, Alert, Card, Image } from "react-bootstrap";
// import { useForm } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as Yup from "yup";
// import axios from "axios";
// import { ENV } from '../config/config';
// import { toast } from "react-toastify";

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
//   image: Yup.mixed()
//     .required("Image is required")
//     .test("fileSize", "File size is too large", (value) => {
//       return value && value.size <= 5 * 1024 * 1024; // 5MB max
//     })
//     .test("fileType", "Unsupported file format", (value) => {
//       return (
//         value &&
//         ["image/jpeg", "image/png", "image/gif"].includes(value.type)
//       );
//     }),
// });

// const Blogs = () => {
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

//   // Image upload handler
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // Validate file manually (optional, since Yup handles it)
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("File size exceeds 5MB");
//         return;
//       }
//       if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
//         toast.error("Only JPEG, PNG, or GIF files are allowed");
//         return;
//       }

//       // Set image for form submission
//       setValue("image", file); // Register the file with react-hook-form

//       // Create preview
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

//   // Form submit handler
//   const onSubmit = async (data) => {
//     try {
//       const formData = new FormData();
//       formData.append("name", data.name);
//       formData.append("email", data.email);
//       formData.append("phone", data.phone);
//       formData.append("address", data.address);
//       formData.append("description", data.description);
//       if (data.image) {
//         formData.append("image", data.image); // Append the image file
//       }

//       const response = await axios.post(`${ENV.appBaseUrl}/admin/blog`, formData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );


//       toast.success("Blog added successfully");
//       setSuccessMessage("Blog added successfully");
//       setErrorMessage("");
//     } catch (error) {
//       const errorMsg = error?.response?.data?.message || "Error adding blog";
//       toast.error(errorMsg);
//       setErrorMessage(errorMsg);
//       setSuccessMessage("");
//     }
//   };

//   return (
//     <div className="container my-4">
//       <h2>Create Blog</h2>
//       {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
//       {successMessage && <Alert variant="success">{successMessage}</Alert>}

//       <Form onSubmit={handleSubmit(onSubmit)}>
//         <Row>
//           <Col md={6}>
//             <Form.Group controlId="name">
//               <Form.Label>Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 placeholder="Enter your name"
//                 {...register("name")}
//               />
//               {errors.name && (
//                 <Form.Text className="text-danger">
//                   {errors.name.message}
//                 </Form.Text>
//               )}
//             </Form.Group>
//           </Col>

//           <Col md={6}>
//             <Form.Group controlId="email">
//               <Form.Label>Email</Form.Label>
//               <Form.Control
//                 type="email"
//                 placeholder="Enter your email"
//                 {...register("email")}
//               />
//               {errors.email && (
//                 <Form.Text className="text-danger">
//                   {errors.email.message}
//                 </Form.Text>
//               )}
//             </Form.Group>
//           </Col>
//         </Row>

//         <Row>
//           <Col md={6}>
//             <Form.Group controlId="phone">
//               <Form.Label>Phone</Form.Label>
//               <Form.Control
//                 type="text" // Changed to text to handle leading zeros
//                 placeholder="Enter your phone number"
//                 {...register("phone")}
//               />
//               {errors.phone && (
//                 <Form.Text className="text-danger">
//                   {errors.phone.message}
//                 </Form.Text>
//               )}
//             </Form.Group>
//           </Col>

//           <Col md={6}>
//             <Form.Group controlId="address">
//               <Form.Label>Address</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={3}
//                 placeholder="Enter your address"
//                 {...register("address")}
//               />
//               {errors.address && (
//                 <Form.Text className="text-danger">
//                   {errors.address.message}
//                 </Form.Text>
//               )}
//             </Form.Group>
//           </Col>
//         </Row>

//         <Form.Group controlId="description">
//           <Form.Label>Description</Form.Label>
//           <Form.Control
//             as="textarea"
//             rows={4}
//             placeholder="Enter description"
//             {...register("description")}
//           />
//           {errors.description && (
//             <Form.Text className="text-danger">
//               {errors.description.message}
//             </Form.Text>
//           )}
//         </Form.Group>

//         <Form.Group controlId="image">
//           <Form.Label>Upload Image</Form.Label>
//           <Form.Control
//             type="file"
//             onChange={handleImageChange}
//             accept="image/jpeg,image/png,image/gif"
//           />
//           {errors.image && (
//             <Form.Text className="text-danger">
//               {errors.image.message}
//             </Form.Text>
//           )}
//         </Form.Group>

//         {imagePreview && (
//           <Card className="mt-3" style={{ width: "18rem" }}>
//             <Card.Body>
//               <Card.Title>Image Preview</Card.Title>
//               <Image src={imagePreview} alt="Preview" rounded fluid />
//             </Card.Body>
//           </Card>
//         )}

//         <Button variant="primary" type="submit" className="mt-3">
//           Submit
//         </Button>
//       </Form>
//     </div>
//   );
// };

// export default Blogs;