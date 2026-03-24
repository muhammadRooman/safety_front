import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Col,
  Row,
  Card,
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
import { useNavigate, useParams } from "react-router-dom";
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
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone is required").matches(/^[0-9]{11}$/, "Phone must be 11 digits"),
  address: Yup.string().required("Address is required"),
  location: Yup.string().required("location is required"),
  subject: Yup.array()
    .of(Yup.string().oneOf(SUBJECT_OPTIONS))
    .min(1, "Select at least one subject / course")
    .nullable(),
  image: Yup.mixed().nullable(),
});

const Edit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const [imagePreview, setImagePreview] = useState(null);

  const handleEmailChange = (e) => {
    const value = e.target.value.toLowerCase(); // convert to lowercase
    setValue("email", value); // update react-hook-form value
  };

  
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`${ENV.appBaseUrl}/admin/enrollTeacher/single/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setValue("name", data.name);
        setValue("email", data.email);
        setValue("phone", data.phone);
        setValue("address", data.address);
        setValue("location", data.location);
        setValue("salary", data.salary);
        // existing subjects (array or single)
        if (Array.isArray(data.subject)) {
          setValue("subject", data.subject);
        } else if (data.subject) {
          setValue("subject", [data.subject]);
        } else {
          setValue("subject", []);
        }
        setImagePreview(data.image);
      } catch (error) {
        toast.error(t("error.fetch_data"));
      }
    };

    fetchStudent();
  }, [id, token, setValue, t]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
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
      if (Array.isArray(data.subject)) {
        data.subject.forEach((s) => formData.append("subject", s));
      } else if (data.subject) {
        formData.append("subject", data.subject);
      }
      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      await axios.patch(`${ENV.appBaseUrl}/admin/enrollTeacher/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(t("success.update"));
      navigate("/dashboard/see_all_teacher_enroll");
    } catch (err) {
      toast.error(err.response?.data?.message || t("error.update"));
    }
  };

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => navigate("/dashboard")}>{t("dashboard")}</Breadcrumb.Item>
            <Breadcrumb.Item active>{t("edit_teacher")}</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>

  
      <Card className="p-4 shadow">
        <h3 className="text-center mb-4 text-primary fw-bold">{t("edit_teacher")}</h3>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="name">
                <Form.Label>{t("name")} <span style={{ color: "red", fontSize: "12px"}}>
                * 
              </span></Form.Label>
                <Form.Control
                  type="text"
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
                <Form.Label>{t("email")} <span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
                <Form.Control
                  type="email"
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
                <Form.Label>{t("phone")} <span style={{ color: "red", fontSize: "12px"}}>
                * 
              </span></Form.Label>
                <Form.Control
                  type="text"
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
                <Form.Label>{t("location")}<span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
               
                <Form.Control
                rows={3}
                  type="text"
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
                <Form.Label>{t("address")} <span style={{ color: "red", fontSize: "12px"}}>
              * 
            </span></Form.Label>
                <Form.Text className="d-block text-muted mb-1">
                Your Current Location whare are you live in pakistan
               </Form.Text>
                <Form.Control
                  as="textarea"
                  rows={3}
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
            <Form.Label>{t("salary")} </Form.Label>
            <Form.Control
              {...register("salary")}
              isInvalid={!!errors.salary}
            />
            <Form.Control.Feedback type="invalid">
              {errors.salary?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="image" className="mb-3">
            <Form.Label>{t("upload_image")} <span style={{ color: "red", fontSize: "12px"}}>
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
            {imagePreview && (
              <div className="text-center mb-4">
                <Card className="mx-auto border-0" style={{ width: "250px" }}>
                  <Card.Img
                    variant="top"
                    src={
                      imagePreview.startsWith("data:")
                        ? imagePreview
                        : `${process.env.REACT_APP_BASE_uploads}/${imagePreview}`
                    }
                  />
                  <Card.Body className="p-2">
                    <Card.Text className="text-muted small">{t("image_preview")}</Card.Text>
                  </Card.Body>
                </Card>
              </div>
            )}
</Row>
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
            {t("update")}
          </Button>
        </div>
        
        </Form>
      </Card>
    </Container>
  );
};

export default Edit;
