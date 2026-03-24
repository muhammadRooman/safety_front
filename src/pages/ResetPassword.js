import React, { useState } from 'react';
import axios from 'axios';
import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { ENV } from '../config/config';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { id, token } = useParams();

  const validate = () => {
    const err = {};
    if (!newPassword) err.newPassword = 'Please enter new password';
    if (!confirmPassword) err.confirmPassword = 'Please confirm your password';
    if (newPassword && confirmPassword && newPassword !== confirmPassword)
      err.confirmPassword = 'Passwords do not match';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${ENV.appBaseUrl}/auth/reset-password/${id}`,
        {
          token,
          newPassword,
        }
      );
console.log("Password has been reset successfully",response.data);
      if (response?.data?.message === "Password has been reset successfully") {
        toast.success(response.data.message || 'Password reset successfully');
        setNewPassword('');
        setConfirmPassword('');
        navigate('/');
      } else {
        toast.error(response?.data?.message || 'Something went wrong');
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(to right, #667eea, #764ba2)',
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="p-4 shadow-lg border-0 rounded-4">
              <h3 className="text-center mb-4">🔐 Reset Password</h3>
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group controlId="newPassword" className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    isInvalid={!!errors.newPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.newPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group controlId="confirmPassword" className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    isInvalid={!!errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 mt-2"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ResetPassword;
