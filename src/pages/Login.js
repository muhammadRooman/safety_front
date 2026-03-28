// src/pages/Login.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/Auth/AuthSlice";
import * as Yup from "yup";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import PublicApi from "../config/PublicApi";
import { ENV } from "../config/config";

console.log("ENV.appBaseUrl", ENV.appBaseUrl);

// Validation Schema
const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"), // ← changed min:2 → min:6
});

function Login() {
  const dispatch = useDispatch();
  const [loader, setLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data) => {
    setLoader(true);
    try {
      const response = await PublicApi.post(`${ENV.appBaseUrl}/auth/login`, data,{
          withCredentials: true
      });
      console.log("login respo", response);

      if (response?.data?.success) {
        toast.success(response.data.message);

        dispatch(
          setUser({
            id: response.data.user.id,
            name: response.data.user.firstName,
            email: response.data.user.email,
            token: response.data.token,
          })
        );

        reset();

        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      } else {
        toast.error(response?.data?.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Container fluid="md" className="px-3 px-md-4">
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={9} lg={8} xl={12}>
            <Card
              className="shadow-lg border-0 overflow-hidden"
              style={{
                borderRadius: "1.5rem",
                background: "#fff",
              }}
            >
              <Row className="g-0">
                {/* Illustration - visible only from md+ */}
                <Col
                  md={5}
                  className="d-none d-md-flex flex-column align-items-center justify-content-center bg-light p-4"
                >
                <img
                src="/OHS3.png"
                alt="Signup Illustration"
                style={{
                  maxWidth: "100%",
                  maxHeight: "380px",
                  objectFit: "contain",
                  opacity: 0.95,
                }}
              />
                  <div
                    className="text-center mt-3 px-3"
                    style={{
                      color: "#4f8cff",
                      fontWeight: 500,
                      fontSize: "0.95rem",
                    }}
                  >
                    Welcome back! Login to continue your journey.
                  </div>
                </Col>

                {/* Form side */}
                <Col xs={12} md={7}>
                  <div className="p-4 p-md-5">
                    <div className="text-center mb-4">
                      <h4 className="fw-bold" style={{ color: "rgb(248 193 20)" }}>
                        Sign In to Your Account
                      </h4>
                      <p className="text-muted small mb-0">
                        We're happy to see you again.
                      </p>
                    </div>

                    <Form onSubmit={handleSubmit(onSubmit)}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Email</Form.Label>
                        <Form.Control
                          type="email"
                          {...register("email")}
                          className="rounded-pill px-4 py-2.5"
                          placeholder="Enter your email"
                          autoComplete="username"
                          isInvalid={!!errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email?.message}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-4 position-relative">
                        <Form.Label className="fw-semibold">Password</Form.Label>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          className="rounded-pill px-4 py-2.5 pe-5"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          isInvalid={!!errors.password}
                        />
                        <span
                          onClick={() => setShowPassword((v) => !v)}
                          style={{
                            position: "absolute",
                            right: "1.25rem",
                            top: "2.35rem",
                            cursor: "pointer",
                            fontSize: "1.3rem",
                            color: "#4f8cff",
                          }}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </span>
                        <Form.Control.Feedback type="invalid">
                          {errors.password?.message}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Button
                        type="submit"
                        className="w-100 rounded-pill py-2.5 fw-bold"
                        style={{
                          background: "rgb(248 193 20)",
                          border: "none",
                          fontSize: "1.1rem",
                        }}
                        disabled={loader}
                      >
                        {loader ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </Form>

                    <div className="my-4 d-flex align-items-center">
                      <div style={{ flex: 1, height: 1, background: "#dee2e6" }} />
                      <span className="mx-3 text-muted small">or</span>
                      <div style={{ flex: 1, height: 1, background: "#dee2e6" }} />
                    </div>

                    <div className="text-center">
                      <div>
                        <span className="text-muted">Don't have an account? </span>
                        <Link
                          to="/register"
                          className="fw-semibold text-decoration-none"
                          style={{ color: "#4f8cff" }}
                        >
                          Sign up
                        </Link>
                      </div>

                     
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .rounded-pill {
          border-radius: 3rem !important;
        }
        .form-control:focus {
          border-color: #4f8cff !important;
          box-shadow: 0 0 0 0.25rem rgba(79, 140, 255, 0.25) !important;
        }
        .card:hover {
          box-shadow: 0 1rem 3rem rgba(0,0,0,0.12) !important;
          transition: box-shadow 0.3s ease;
        }
        @media (max-width: 576px) {
          .p-4,
          .p-md-5 {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;