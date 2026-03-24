import React, { useState } from "react";
import {
  Form,
  Button,
  Col,
  Row,
  Alert,
  Card,
  Image,
  Container,
  Breadcrumb,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "axios";
import { ENV } from "../../config/config";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// Subjects / courses this teacher can teach
const SUBJECT_OPTIONS = [
  "NEBOSH",
  "IOSH",
  "OSHA",
  "ISO Safety",
  "RIGGER3",
  "AD Safety",
  "First Aid",
  "Fire Safety",
];

// Validation Schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: Yup.string()
    .required("Phone is required")
    .matches(/^[0-9]{11}$/, "Phone number must be 11 digits"),
  address: Yup.string().required("Address is required"),
  location: Yup.string().required("location is required"),
  // Multi-select subjects
  subject: Yup.array()
    .of(Yup.string().oneOf(SUBJECT_OPTIONS))
    .min(1, "Select at least one subject / course"),
  image: Yup.mixed()
    .required("Image is required")
    .test(
      "fileSize",
      "File size is too large",
      (value) => value && value.size <= 5 * 1024 * 1024
    )
    .test(
      "fileType",
      "Unsupported file format",
      (value) =>
        value && ["image/jpeg", "image/png", "image/gif"].includes(value.type)
    ),
});

const Create = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const id = useSelector((state) => state.auth.id);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(validationSchema) });

  const [imagePreview, setImagePreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase(); // convert to lowercase
    setValue("email", value); // update react-hook-form value
  };

  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024)
        return toast.error("File size exceeds 5MB");
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type))
        return toast.error("Only JPEG, PNG, or GIF files are allowed");

      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setValue("image", null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("address", data.address);
      formData.append("location", data.location);
      formData.append("salary", data.salary);
      // subject can be string[] from multi-select
      if (Array.isArray(data.subject)) {
        data.subject.forEach((s) => formData.append("subject", s));
      } else if (data.subject) {
        formData.append("subject", data.subject);
      }
      formData.append("userId", id);
      if (data.image) formData.append("image", data.image);

      await axios.post(`${ENV.appBaseUrl}/admin/enrollTeacher`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Enrollment submitted successfully");
      navigate("/dashboard/see_all_teacher_enroll");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting form");
    }
  };

  return (
    <Container className="py-5">
    <Row>
    <Col>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>{t("dashboard")}</Breadcrumb.Item>
        <Breadcrumb.Item active>{t("create_teacher")}</Breadcrumb.Item>
      </Breadcrumb>
    </Col>
  </Row>
      <Card className="p-4 shadow">
      
        <h3 className="text-center mb-4">Create New Teacher</h3>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="name">
                <Form.Label>Name <span style={{ color: "red", fontSize: "12px"}}>
                * 
              </span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  {...register("name")}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="email">
                <Form.Label>Email <span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  onChange={handleEmailChange} // force lowercase while typing
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="phone">
                <Form.Label>Phone <span style={{ color: "red", fontSize: "12px"}}>
                * 
              </span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter 11-digit phone number"
                  {...register("phone")}
                  isInvalid={!!errors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="location">
                <Form.Label>Location <span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="location"
                  {...register("location")}
                  isInvalid={!!errors.location}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.location?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
           
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="subject">
                <Form.Label>Subjects / Courses <span style={{ color: "red", fontSize: "12px"}}>
                * 
              </span></Form.Label>
                <Form.Text className="d-block text-muted mb-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple courses this teacher can teach.
                </Form.Text>
                <Form.Control
                  as="select"
                  multiple
                  {...register("subject")}
                  isInvalid={!!errors.subject}
                  defaultValue={[]}
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors.subject?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
             <Col md={6}>
              <Form.Group controlId="address">
                <Form.Label>Address <span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
                <Form.Text className="d-block text-muted mb-1">
               Your Current Location whare are you live in pakistan
              </Form.Text>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter address"
                  {...register("address")}
                  isInvalid={!!errors.address}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.address?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
              </Row>
              <Row>
           
             <Col md={6}>
              <Form.Group controlId="salary">
                <Form.Label>Salary</Form.Label>
                <Form.Control
                  placeholder="Enter Teacher Salary"
                  {...register("salary")}
                
                />
              </Form.Group>
            </Col>
          
        
<Col md={6}>

          <Form.Group controlId="image" className="mb-3">
            <Form.Label>Upload Image <span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
            <Form.Control
              type="file"
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/gif"
              isInvalid={!!errors.image}
            />
            <Form.Control.Feedback type="invalid">
              {errors.image?.message}
            </Form.Control.Feedback>
          </Form.Group>
          </Col>
   </Row>
          {imagePreview && (
            <div className="text-center mb-4">
              <Card className="mx-auto border-0" style={{ width: "250px" }}>
                <Card.Img variant="top" src={imagePreview} />
                <Card.Body className="p-2">
                  <Card.Text className="text-muted small">
                    Image Preview
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>
          )}

          <div className="text-center">
          <Button
            className="back_button me-2" // add margin to the right
            style={{ borderRadius: 20, fontWeight: 500 }}
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            &larr; {t("Cancel")}
          </Button>
        
          <Button type="submit" className="px-5 py-2 buttonColor">
            {t("Submit")}
          </Button>
        </div>
        
        </Form>
      </Card>
    </Container>
  );
};

export default Create;
