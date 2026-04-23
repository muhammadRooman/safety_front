import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Breadcrumb,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import PublicApi from '../../config/PublicApi';
import { ENV } from '../../config/config';
import './StudentRegister.css';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[0-9]{10,15}$/, 'Phone must be 10-15 digits'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

function StudentRegister() {
  const [loader, setLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'student',
      };
      const response = await PublicApi.post(`${ENV.appBaseUrl}/auth/signup`, payload);

      if (response?.data?.message === 'User registered successfully') {
        toast.success(response.data.message);
        reset();
        navigate('/dashboard/students_enroll');
      } else {
        toast.error(response?.data?.message || 'Signup failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="student-register-page">
      <Container fluid="md" className="px-2 px-sm-3 px-md-4">
        <Breadcrumb className="student-register-breadcrumb">
          <Breadcrumb.Item onClick={() => navigate('/dashboard')}>
            Dashboard
          </Breadcrumb.Item>
          <Breadcrumb.Item active>Register</Breadcrumb.Item>
        </Breadcrumb>

        <Row className="justify-content-center g-3">
          <Col xs={12} lg={11} xl={10}>
            <Card className="student-register-card border-0">
              <Row className="g-0 align-items-stretch">
                <Col
                  md={5}
                  className="d-none d-md-flex flex-column align-items-center justify-content-center student-register-hero p-4 p-lg-4"
                >
                  <img
                    src="/OHS3.png"
                    alt="OHS Academy"
                    className="mb-3"
                  />
                  <p className="text-center px-2 mb-0 small text-muted lh-sm">
                    Create a student account to access courses and materials.
                  </p>
                </Col>

                <Col xs={12} md={7}>
                  <div className="student-register-form-inner p-3 p-sm-4 p-lg-5">
                    <div className="text-center mb-4">
                      <h1 className="h4 fw-bold student-register-title mb-2">
                        Register student account
                      </h1>
                      <p className="text-muted small mb-0">
                        Quick and secure — fill in the details below.
                      </p>
                    </div>

                    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                      <Row className="g-3">
                        <Col xs={12} md={6}>
                          <Form.Label className="fw-semibold small mb-1">
                            Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            {...register('name')}
                            className="rounded-pill px-3 px-sm-4 py-2 py-sm-2.5"
                            placeholder="Full name"
                            autoComplete="name"
                            isInvalid={!!errors.name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.name?.message}
                          </Form.Control.Feedback>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Label className="fw-semibold small mb-1">
                            Email
                          </Form.Label>
                         <Form.Control
  type="email"
  {...register('email')}
  onInput={(e) => {
    e.target.value = e.target.value.toLowerCase();
  }}
  className="rounded-pill px-3 px-sm-4 py-2 py-sm-2.5"
  placeholder="Email address"
  autoComplete="email"
  isInvalid={!!errors.email}
/>
                          <Form.Control.Feedback type="invalid">
                            {errors.email?.message}
                          </Form.Control.Feedback>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Label className="fw-semibold small mb-1">
                            Phone
                          </Form.Label>
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            {...register('phone')}
                            className="rounded-pill px-3 px-sm-4 py-2 py-sm-2.5"
                            placeholder="10–15 digits"
                            autoComplete="tel"
                            isInvalid={!!errors.phone}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone?.message}
                          </Form.Control.Feedback>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Label className="fw-semibold small mb-1">
                            Password
                          </Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              {...register('password')}
                              className="rounded-pill px-3 px-sm-4 py-2 py-sm-2.5 pe-5"
                              placeholder="At least 6 characters"
                              autoComplete="new-password"
                              isInvalid={!!errors.password}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                              }
                              onClick={() => setShowPassword((v) => !v)}
                            >
                              {showPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          <Form.Control.Feedback type="invalid" className="d-block">
                            {errors.password?.message}
                          </Form.Control.Feedback>
                        </Col>

                        <Col xs={12} md={6}>
                          <Form.Label className="fw-semibold small mb-1">
                            Confirm password
                          </Form.Label>
                          <div className="position-relative">
                            <Form.Control
                              type={showConfirmPassword ? 'text' : 'password'}
                              {...register('confirmPassword')}
                              className="rounded-pill px-3 px-sm-4 py-2 py-sm-2.5 pe-5"
                              placeholder="Repeat password"
                              autoComplete="new-password"
                              isInvalid={!!errors.confirmPassword}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              aria-label={
                                showConfirmPassword
                                  ? 'Hide confirm password'
                                  : 'Show confirm password'
                              }
                              onClick={() => setShowConfirmPassword((v) => !v)}
                            >
                              {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          <Form.Control.Feedback type="invalid" className="d-block">
                            {errors.confirmPassword?.message}
                          </Form.Control.Feedback>
                        </Col>
                      </Row>

                      <Button
                        type="submit"
                        className="w-100 rounded-pill py-2.5 fw-bold mt-3 buttonColor"
                        disabled={loader}
                      >
                        {loader ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          'Register'
                        )}
                      </Button>
                    </Form>

                    <div className="my-4 d-flex align-items-center student-register-divider flex-wrap justify-content-center">
                      <div
                        className="student-register-divider-line d-none d-sm-block"
                        aria-hidden
                      />
                      <span className="mx-sm-3 text-muted small px-1">
                        Farooq Khan (CEO)
                      </span>
                      <div
                        className="student-register-divider-line d-none d-sm-block"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default StudentRegister;
