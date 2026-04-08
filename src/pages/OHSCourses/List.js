import React, { useEffect, useMemo, useState } from "react";
import { Breadcrumb, Container, Row, Col, Card, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const List = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  const DEFAULT_COURSES = [
    "NEBOSH",
    "IOSH",
    "OSHA",
    "Rigger 1",
    "Rigger 2",
    "RIGGER3",
    "Risk Assessment",
    "First Aid",
    "Fire Safety",
  ];

  const DEFAULT_DESCRIPTION =
    "This course is designed to enhance your skills and knowledge in occupational health & safety.";
  const DEFAULT_CONTACT = {
    name: "Farooq Khan (CEO)",
    email: "muhammadrooman5@gmail.com",
    phone: "0333-0222006",
    address: "House #3, Peshawar Saddar",
  };

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/admin/ohs-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nextCourses = Array.isArray(res.data?.courses) ? res.data.courses : DEFAULT_COURSES;
        const nextDescription =
          typeof res.data?.description === "string" && res.data.description.trim()
            ? res.data.description
            : DEFAULT_DESCRIPTION;

        setCourses(nextCourses.length ? nextCourses : DEFAULT_COURSES);
        setDescription(nextDescription);
        setContact({
          name: res.data?.name || DEFAULT_CONTACT.name,
          email: res.data?.email || DEFAULT_CONTACT.email,
          phone: res.data?.phone || DEFAULT_CONTACT.phone,
          address: res.data?.address || DEFAULT_CONTACT.address,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load OHS courses");
        setCourses(DEFAULT_COURSES);
        setDescription(DEFAULT_DESCRIPTION);
        setContact(DEFAULT_CONTACT);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const chunkedCourses = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    const chunks = [];
    for (let i = 0; i < list.length; i += 3) {
      chunks.push(list.slice(i, i + 3));
    }
    return chunks;
  }, [courses]);

  const handleCardClick = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>OHS All Courses</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="mb-4 fw-semibold name_heading">OHS Academy - All Courses</h3>

      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : chunkedCourses.length ? (
        chunkedCourses.map((chunk, rowIndex) => (
          <Row className="mb-3 g-3" key={rowIndex}>
            {chunk.map((course, colIndex) => (
              <Col xs={12} sm={6} md={4} key={colIndex} >
                <Card  className="course-card shadow-sm border-0 border-start border-warning border-4"
                style={{ borderRadius: "12px" }}
                 
                  onClick={() => handleCardClick(course)}
                >
                  <Card.Body className="fw-bold">{course}</Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ))
      ) : (
        <div className="alert alert-warning">No OHS courses found.</div>
      )}
      <h5 className="course_information">Course Information</h5>
      <div className="description-scroll-box">
      <p className="mb-0">{description}</p>
    </div>
      {/* Modal for selected course */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="md"
        scrollable
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton className="bg-warning text-black">
          <Modal.Title>Course: {selectedCourse}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5 className="course_information">Course Information</h5>
          <div className="description-scroll-box">
            <p className="mb-0">{description}</p>
          </div>
          <hr />
          <h6>Contact Details</h6>
          <div
            style={{
              backgroundColor: " #fff3cd",
              color: "black",
              padding: "8px",
              borderRadius: "4px",
              marginBottom: "5px",
            }}
          >
            <strong>Name:</strong> {contact.name}
          </div>
          <div
            style={{
              backgroundColor: " #fff3cd",
              color: "black",
              padding: "8px",
              borderRadius: "4px",
              marginBottom: "5px",
            }}
          >
            <strong>Email:</strong> {contact.email}
          </div>
          <div
            style={{
              backgroundColor: " #fff3cd",
              color: "black",
              padding: "8px",
              borderRadius: "4px",
              marginBottom: "5px",
            }}
          >
            <strong>Phone:</strong> {contact.phone}
          </div>
          <div
            style={{
              backgroundColor: " #fff3cd",
              color: "black",
              padding: "8px",
              borderRadius: "4px",
              marginBottom: "5px",
            }}
          >
            <strong>Address:</strong> {contact.address}
          </div>
          <hr />
          <p className="text-muted">
            Interested in this course? Reach out to our team for more details and guidance. Thanks!
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom CSS for hover effect */}
      <style jsx>{`
        .course-card {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, color 0.2s;
        }
        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          background-color: #ffc92a; /* Yellow background */
          color: #000; /* Black text */
        }
        .description-scroll-box {
          max-height: 140px;
          overflow-y: auto;
          padding: 8px 10px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          background: #fff3cd;
        }
      `}</style>
    </Container>
  );
};

export default List;