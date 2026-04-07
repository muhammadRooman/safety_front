import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ENV } from "../config/config";
import TokenApi from "../config/TokenApi";
import { Form, Button, Row, Col, Spinner, Breadcrumb } from "react-bootstrap";
import axios from "axios";
import { useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const id = useSelector((state) => state.auth.id);
  const token = useSelector((state) => state.auth.token);

  const schema = yup.object().shape({
    name: yup.string().required(t("Name is required")),
    email: yup.string().email(t("Invalid email")).required(t("Email is required")),
    phone: yup.string().required(t("Phone is required")),
    password: yup.string(),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password"), null], t("Passwords must match")),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${ENV.appBaseUrl}/auth/getUser/${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        });
        const { name, email, phone } = res.data.user;
        setValue("name", name);
        setValue("email", email);
        setValue("phone", phone);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
  }, [setValue, id, token]);

  const onSubmit = async (data) => {
    try {
      const payload = { name: data.name, email: data.email, phone: data.phone };
      if (data.password) payload.password = data.password;

      await axios.put(`${ENV.appBaseUrl}/auth/updateUser/${id}`, payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      toast.success(t("Profile updated successfully"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("Update failed"));
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-glass-card">
        {/* Breadcrumb - left aligned inside card */}
        <Breadcrumb className="mb-3" style={{ paddingLeft: 0 }}>
          <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
            {t("dashboard")}
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{t("profile")}</Breadcrumb.Item>
        </Breadcrumb>

       

        {/* Logo */}
        <div className="d-flex align-items-center mb-4 justify-content-center">
          <img
            src="/OHS3.png" // replace with your logo path
            alt="OHS Academy Logo"
            style={{ height: "clamp(80px, 22vw, 150px)", maxWidth: "100%", objectFit: "contain" }}
          />
        </div>

        {/* Profile Form */}
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formName">
                <Form.Label className="fw-semibold">{t("Name")}</Form.Label>
                <Form.Control
                  type="text"
                  {...register("name")}
                  className="rounded-pill px-4 py-3 profile-input w-100"
                  placeholder={t("Enter your name")}
                />
                <small className="text-danger ms-1">{errors.name?.message}</small>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formEmail">
                <Form.Label className="fw-semibold">{t("Email")}</Form.Label>
                <Form.Control
                  type="email"
                  {...register("email")}
                  className="rounded-pill px-4 py-3 profile-input w-100"
                  placeholder={t("Enter your email")}
                />
                <small className="text-danger ms-1">{errors.email?.message}</small>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formPhone">
                <Form.Label className="fw-semibold">{t("Phone")}</Form.Label>
                <Form.Control
                  type="text"
                  {...register("phone")}
                  className="rounded-pill px-4 py-3 profile-input w-100"
                  placeholder={t("Enter your phone")}
                />
                <small className="text-danger ms-1">{errors.phone?.message}</small>
              </Form.Group>
            </Col>
          </Row>

          <hr />
          <h5 className="mb-3">{t("Change Password")}</h5>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formNewPassword">
                <Form.Label className="fw-semibold">{t("New Password")}</Form.Label>
                <div className="profile-input-wrap">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="rounded-pill px-4 py-3 profile-input w-100"
                    placeholder={t("Enter new password")}
                  />
                  <span
                    className="profile-toggle-pw"
                    onClick={() => setShowPassword((v) => !v)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowPassword((v) => !v);
                      }
                    }}
                    title={showPassword ? t("Hide password") : t("Show password")}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <small className="text-danger ms-1">{errors.password?.message}</small>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="formConfirmPassword">
                <Form.Label className="fw-semibold">{t("Confirm Password")}</Form.Label>
                <div className="profile-input-wrap">
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className="rounded-pill px-4 py-3 profile-input w-100"
                    placeholder={t("Confirm new password")}
                  />
                  <span
                    className="profile-toggle-pw"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowConfirmPassword((v) => !v);
                      }
                    }}
                    title={showConfirmPassword ? t("Hide password") : t("Show password")}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <small className="text-danger ms-1">{errors.confirmPassword?.message}</small>
              </Form.Group>
            </Col>
          </Row>

          <Button
            variant="primary"
            type="submit"
            className="mt-2 w-100 rounded-pill fw-bold py-3 profile-btn fs-5 buttonColor"
            style={{
            
              border: "none",
              fontSize: "1.15rem",
              letterSpacing: 1,
              transition: "box-shadow 0.2s, background 0.2s",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner animation="border" size="sm" /> : t("Update Profile")}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Profile;
