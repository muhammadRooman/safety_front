import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Card, Container, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8082/api/auth/forgot-password', { email });

      if (response?.data?.message === "Password reset link sent to your email") {
        toast.success(response.data.message || 'Password reset email sent');
        setEmail('');
      } else {
        toast.success(response?.data?.message || 'Something went wrong');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)", display: "flex", alignItems: "center", justifyContent: "center", overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Container>
          <Row className="align-items-center" style={{ minHeight: "80vh" }}>
            <Col md={7} lg={6} xl={5}>
              <Card
                className="shadow-lg border-0 p-4 d-flex flex-row align-items-stretch signup-card-hover"
                style={{ borderRadius: "1.5rem", background: "#fff", overflow: "hidden", width: "250%", margin: "0 auto" }}
              >
                {/* Illustration (left side, only on md+) */}
                <div className="d-none d-md-flex flex-column align-items-center justify-content-center" style={{ background: "#f4f7fb", width: "38%", minHeight: 320 }}>
                  <img src="/signup.jpg" alt="Forgot Password Illustration" style={{ maxWidth: 483, maxHeight: 500, opacity: 1, marginBottom: 12 }} />
                  <div className="text-center px-2" style={{ color: '#4f8cff', fontWeight: 500, fontSize: 15 }}>
                    Trouble logging in? Reset your password easily!
                  </div>
                </div>
                {/* Form (right side) */}
                <div className="flex-grow-1 ps-md-4" style={{ minWidth: 0 }}>
                  <div className="mb-2 mt-2 text-center">
                    <span className="fw-bold fs-5" style={{ color: '#4f8cff', letterSpacing: 1 }}>Forgot Password</span>
                    <div className="text-secondary small">Enter your email to receive a reset link.</div>
                  </div>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formBasicEmail" className="mb-3">
                      <Form.Label className="fw-semibold">Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-pill px-4 py-3 signup-input fs-5 w-100"
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      type="submit"
                      className="mt-2 w-100 rounded-pill fw-bold py-3 signup-btn fs-4"
                      style={{ background: "#4f8cff", border: "none", fontSize: "1.25rem", letterSpacing: 1, transition: "box-shadow 0.2s, background 0.2s" }}
                      disabled={loading}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Link'}
                    </Button>
                  </Form>
                  <div className="my-4 d-flex align-items-center">
                    <div style={{ flex: 1, height: 1, background: "#e0e7ef" }} />
                    <span className="mx-2 text-secondary small">or</span>
                    <div style={{ flex: 1, height: 1, background: "#e0e7ef" }} />
                  </div>
                  <div className="text-center">
                    <span className="text-secondary">Don't have an account? </span>
                    <Link to="/register" className="fw-semibold text-decoration-none" style={{ color: "#4f8cff" }}>
                      Sign up
                    </Link>
                    <br />
                    <span className="text-secondary">You have an already an account? </span>
                    <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: "#4f8cff" }}>
                     Login
                    </Link>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      {/* Custom styles for hover/focus */}
      <style>{`
        .signup-card-hover:hover {
          box-shadow: 0 0 32px 0 #b6c6e6 !important;
        }
        .signup-btn:hover, .signup-btn:focus {
          background: #2563eb !important;
          box-shadow: 0 4px 16px 0 #b6c6e6;
        }
        .signup-input:focus {
          border-color: #4f8cff !important;
          box-shadow: 0 0 0 0.15rem #4f8cff33 !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ForgetPassword;
