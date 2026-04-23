import React, { useState } from "react";
import {
  Container,
  Form,
  Button,
  Alert,
  Modal,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaUserGraduate,
  FaEnvelope,
  FaBookOpen,
  FaLanguage,
  FaUpload,
  FaEdit,
  FaCheckCircle,
  FaPhoneAlt,
} from "react-icons/fa";
import "./StudentRegistration.css";

const StudentRegistration = () => {
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.id);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    courseName: "",
    phone: "",
    language: "English",
    profileImage: null,
  });

  const [registrations, setRegistrations] = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(true);
  const [showMyRegistrations, setShowMyRegistrations] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;
  const REACT_APP_BASE_uploads = process.env.REACT_APP_BASE_uploads;

  // Fetch Registrations
  const fetchMyRegistrations = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE}/student-registrations/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRegistrations(response.data.registrations || []);
      setShowMyRegistrations(true);
      setShowRegistrationForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Image Change
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.courseName || !formData.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("courseName", formData.courseName);
      submitData.append("phone", formData.phone);
      submitData.append("language", formData.language);
      submitData.append("userId", userId || "");

      if (formData.profileImage) {
        submitData.append("profileImage", formData.profileImage);
      }

      if (editingId) {
        await axios.put(
          `${API_BASE}/student-registrations/${editingId}`,
          submitData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Updated Successfully");
        setEditingId(null);
      } else {
        await axios.post(
          `${API_BASE}/student-registrations/create`,
          submitData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Registration Submitted");
        setShowSuccessModal(true);
      }

      setFormData({
        name: "",
        email: "",
        courseName: "",
        phone: "",
        language: "English",
        profileImage: null,
      });

      setImagePreview(null);

      fetchMyRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEdit = (reg) => {
    setFormData({
      name: reg.name,
      email: reg.email,
      courseName: reg.courseName,
      language: reg.language,
      phone: reg.phone,
      profileImage: null,
    });

    setImagePreview(
      reg.profileImage
        ? `${REACT_APP_BASE_uploads}/registrations/${reg.profileImage}`
        : null
    );

    setEditingId(reg._id);
    setShowRegistrationForm(true);
    setShowMyRegistrations(false);
  };

  return (
    <div className="student-page">
      <Container className="py-5">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold main-title">Student Registration Portal</h1>
          <p className="text-muted">
            Register for your desired course quickly and professionally.
          </p>
        </div>

        {/* Tabs */}
        <div className="tab-buttons mb-4">
          <Button
            className="tab-btn"
            variant={showRegistrationForm ? "primary" : "outline-primary"}
            onClick={() => {
              setShowRegistrationForm(true);
              setShowMyRegistrations(false);
            }}
          >
            New Registration
          </Button>

          <Button
            className="tab-btn"
            variant={showMyRegistrations ? "primary" : "outline-primary"}
            onClick={fetchMyRegistrations}
          >
            My Registrations
          </Button>
        </div>

        {/* FORM */}
        {showRegistrationForm && (
          <Card className="shadow-lg border-0 form-card">
            <Card.Body className="p-4 p-md-5">
              <h3 className="mb-4 fw-bold text-center">
                {editingId ? "Edit Registration" : "Student Form"}
              </h3>

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaUserGraduate /> Full Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter Full Name"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaEnvelope /> Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter Email"
                        disabled={!!editingId}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaBookOpen /> Course Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="courseName"
                        value={formData.courseName}
                        onChange={handleInputChange}
                        placeholder="Enter Course Name"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaLanguage /> Language
                      </Form.Label>
                      <Form.Select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                      >
                        <option>English</option>
                        <option>Urdu</option>
                        <option>Pashto</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
 <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaPhoneAlt /> Phone Number
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter Phone Number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>
                        <FaUpload /> Upload Profile Image
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Form.Group>
                  </Col>

                  {imagePreview && (
                    <Col md={12} className="mb-4 text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="preview-img"
                      />
                    </Col>
                  )}
                </Row>

                <Button
                  type="submit"
                  className="submit-btn w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" /> Processing...
                    </>
                  ) : editingId ? (
                    "Update Registration"
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* LIST */}
        {showMyRegistrations && (
          <Row className="g-4">
            {registrations.length > 0 ? (
              registrations.map((reg) => (
                <Col md={6} lg={4} key={reg._id}>
                  <Card className="shadow border-0 reg-card h-100">
                   <div className="img-wrap">
  <img
    src={`${REACT_APP_BASE_uploads}/registrations/${reg.profileImage}`}
    alt={reg.name}
    className="card-img-top reg-img"
    style={{
      width: "100%",
      height: "220px",
      objectFit: "contain",
      objectPosition: "center",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
  />
</div>

                    <Card.Body>
                      <h5 className="fw-bold"><strong>Name:</strong> {reg.name}</h5>
                      <p className="mb-1"><strong>Email:</strong> {reg.email}</p>
                      <p className="mb-1"><strong>Course:</strong> {reg.courseName}</p>
                      <p className="mb-1"><strong>Phone:</strong> {reg.phone}</p>
                      <p className="mb-3"><strong>Language:</strong> {reg.language}</p>

                      <Badge
                        bg={
                          reg.status === "approved" ? "success" : "warning"
                        }
                        className="mb-3"
                      >
                        {reg.status}
                      </Badge>
{reg.status === "approved" && <p className="mb-3 text-success">Your registration has been approved! Please check your email or Phone Number for further instructions.</p>
  
}
                      <Button
                        variant="outline-primary"
                        className="w-100"
                        onClick={() => handleEdit(reg)}
                      >
                        <FaEdit /> Edit
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Alert variant="info">No Registrations Found</Alert>
            )}
          </Row>
        )}

        {/* Success Modal */}
        <Modal
          centered
          show={showSuccessModal}
          onHide={() => setShowSuccessModal(false)}
        >
          <Modal.Body className="text-center p-5">
            <FaCheckCircle className="success-icon mb-3" />
            <h3>Registration Submitted</h3>
            <p>Your request is under review.</p>

            <Button
              variant="primary"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default StudentRegistration;










// import React, { useState, useEffect } from 'react';
// import { Container, Form, Button, Alert, Modal, Row, Col } from 'react-bootstrap';
// import { useSelector } from 'react-redux';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { useTranslation } from 'react-i18next';
// import './StudentRegistration.css';

// const StudentRegistration = () => {
//   const { t } = useTranslation();
//   const token = useSelector((state) => state.auth.token);
//   const userId = useSelector((state) => state.auth.id);

//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     courseName: '',
//     language: 'English',
//     profileImage: null,
//   });

//   const [registrations, setRegistrations] = useState([]);
//   const [showRegistrationForm, setShowRegistrationForm] = useState(true);
//   const [showMyRegistrations, setShowMyRegistrations] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [imagePreview, setImagePreview] = useState(null);

//   const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;
//   const REACT_APP_BASE_uploads = process.env.REACT_APP_BASE_uploads;

//   // Fetch user's registrations
//   const fetchMyRegistrations = async () => {
//     if (!userId) return;
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `${API_BASE}/student-registrations/user/${userId}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setRegistrations(response.data.registrations || []);
//       setShowMyRegistrations(true);
//       setShowRegistrationForm(false);
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to fetch registrations');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFormData((prev) => ({
//         ...prev,
//         profileImage: file,
//       }));
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.name || !formData.email || !formData.courseName) {
//       toast.error('Please fill all required fields');
//       return;
//     }

//     try {
//       setLoading(true);

//       const submitData = new FormData();
//       submitData.append('name', formData.name);
//       submitData.append('email', formData.email);
//       submitData.append('courseName', formData.courseName);
//       submitData.append('language', formData.language);
//       submitData.append('userId', userId || '');
//       if (formData.profileImage) {
//         submitData.append('profileImage', formData.profileImage);
//       }

//       if (editingId) {
//         // Update existing registration
//         await axios.put(
//           `${API_BASE}/student-registrations/${editingId}`,
//           submitData,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'multipart/form-data',
//             },
//           }
//         );
//         toast.success('Registration updated successfully');
//         setEditingId(null);
//       } else {
//         // Create new registration
//         await axios.post(`${API_BASE}/student-registrations/create`, submitData, {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//         });
//         toast.success('Registration submitted successfully! Status: Pending');
//         setShowSuccessModal(true);
//       }

//       // Reset form
//       setFormData({
//         name: '',
//         email: '',
//         courseName: '',
//         language: 'English',
//         profileImage: null,
//       });
//       setImagePreview(null);

//       // Refresh registrations
//       if (userId) {
//         fetchMyRegistrations();
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to submit registration');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (registration) => {
//     setFormData({
//       name: registration.name,
//       email: registration.email,
//       courseName: registration.courseName,
//       language: registration.language,
//       profileImage: null,
//     });
//     setImagePreview(registration.profileImage ? `${REACT_APP_BASE_uploads}/registrations/${registration.profileImage}` : null);
//     setEditingId(registration._id);
//     setShowMyRegistrations(false);
//     setShowRegistrationForm(true);
//   };

//   const handleCancel = () => {
//     setFormData({
//       name: '',
//       email: '',
//       courseName: '',
//       language: 'English',
//       profileImage: null,
//     });
//     setImagePreview(null);
//     setEditingId(null);
//     setShowRegistrationForm(false);
//   };

//   return (
//     <Container className="student-registration py-5">
//       <h2 className="mb-4 text-center">Student Registration</h2>

//       <div className="mb-4 d-flex gap-2 justify-content-center">
//         <Button
//           variant={showRegistrationForm ? 'primary' : 'outline-primary'}
//           onClick={() => {
//             setShowRegistrationForm(true);
//             setShowMyRegistrations(false);
//           }}
//         >
//           New Registration
//         </Button>
//         <Button
//           variant={showMyRegistrations ? 'primary' : 'outline-primary'}
//           onClick={fetchMyRegistrations}
//         >
//           My Registrations
//         </Button>
//       </div>

//       {/* Registration Form */}
//       {showRegistrationForm && (
//         <div className="registration-form-container">
//           <div className="form-card">
//             <h4 className="mb-4">
//               {editingId ? 'Edit Registration' : 'New Student Registration'}
//             </h4>

//             <Form onSubmit={handleSubmit}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Full Name *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   placeholder="Enter your full name"
//                   required
//                 />
//               </Form.Group>

//               <Form.Group className="mb-3">
//                 <Form.Label>Email *</Form.Label>
//                 <Form.Control
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="Enter your email"
//                   disabled={!!editingId}
//                   required
//                 />
//               </Form.Group>

//               <Form.Group className="mb-3">
//                 <Form.Label>Course Name *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   name="courseName"
//                   value={formData.courseName}
//                   onChange={handleInputChange}
//                   placeholder="Enter course name"
//                   required
//                 />
//               </Form.Group>

//               <Form.Group className="mb-3">
//                 <Form.Label>Language *</Form.Label>
//                 <Form.Select
//                   name="language"
//                   value={formData.language}
//                   onChange={handleInputChange}
//                   required
//                 >
//                   <option value="English">English</option>
//                   <option value="Urdu">Urdu</option>
//                   <option value="Pashto">Pashto</option>
//                 </Form.Select>
//               </Form.Group>

//               <Form.Group className="mb-3">
//                 <Form.Label>Profile Image</Form.Label>
//                 <Form.Control
//                   type="file"
//                   name="profileImage"
//                   onChange={handleImageChange}
//                   accept="image/*"
//                 />
//                 {imagePreview && (
//                   <div className="mt-3">
//                     <img
//                       src={imagePreview}
//                       alt="Preview"
//                       className="img-thumbnail"
//                       style={{ maxWidth: '200px', maxHeight: '200px' }}
//                     />
//                   </div>
//                 )}
//               </Form.Group>

//               <div className="d-flex gap-2">
//                 <Button
//                   variant="primary"
//                   type="submit"
//                   disabled={loading}
//                   className="w-100"
//                 >
//                   {loading ? 'Processing...' : editingId ? 'Update' : 'Submit'}
//                 </Button>
//                 {editingId && (
//                   <Button
//                     variant="secondary"
//                     onClick={handleCancel}
//                     className="w-100"
//                   >
//                     Cancel
//                   </Button>
//                 )}
//               </div>
//             </Form>
//           </div>
//         </div>
//       )}

//       {/* My Registrations List */}
//       {showMyRegistrations && (
//         <div className="registrations-list-container">
//           {registrations.length > 0 ? (
//             <Row>
//               {registrations.map((reg) => (
//                 <Col md={6} lg={4} key={reg._id} className="mb-4">
//                   <div className="registration-card">
//                     {reg.profileImage && (
//                       <div className="registration-image-container">
//                         <img
//                           src={`${REACT_APP_BASE_uploads}/registrations/${reg.profileImage}`}
//                           alt={reg.name}
//                           className="registration-image"
//                         />
//                       </div>
//                     )}
//                     <div className="registration-details">
//                       <h5>{reg.name}</h5>
//                       <p>
//                         <strong>Email:</strong> {reg.email}
//                       </p>
//                       <p>
//                         <strong>Course:</strong> {reg.courseName}
//                       </p>
//                       <p>
//                         <strong>Language:</strong> {reg.language}
//                       </p>
//                       <p>
//                         <strong>Status:</strong>{' '}
//                         <span
//                           className={`badge bg-${
//                             reg.status === 'approved' ? 'success' : 'warning'
//                           }`}
//                         >
//                           {reg.status === 'approved'
//                             ? 'Approved - Admin will contact you soon'
//                             : 'Pending - Admin will contact you soon'}
//                         </span>
//                       </p>
//                       <Button
//                         variant="info"
//                         size="sm"
//                         onClick={() => handleEdit(reg)}
//                         className="w-100"
//                       >
//                         Edit
//                       </Button>
//                     </div>
//                   </div>
//                 </Col>
//               ))}
//             </Row>
//           ) : (
//             <Alert variant="info">No registrations yet</Alert>
//           )}
//           <Button
//             variant="secondary"
//             onClick={() => setShowMyRegistrations(false)}
//             className="w-100 mt-3"
//           >
//             Back
//           </Button>
//         </div>
//       )}

//       {/* Success Modal */}
//       <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Registration Submitted</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <p className="text-success">
//             ✓ Your registration has been submitted successfully!
//           </p>
//           <p>
//             <strong>Status:</strong> <span className="badge bg-warning">Pending</span>
//           </p>
//           <p>
//             Our admin team is reviewing your application. We will contact you very soon.
//             Thank you for registering!
//           </p>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="primary"
//             onClick={() => setShowSuccessModal(false)}
//           >
//             Close
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default StudentRegistration;
