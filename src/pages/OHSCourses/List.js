import React, { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  Container,
  Row,
  Col,
  Card,
  Modal,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FaBookOpen } from "react-icons/fa";
import { LuImageOff } from "react-icons/lu";
const List = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;
  const API_upload = process.env.REACT_APP_BASE_uploads;

  const DEFAULT_COURSES = [
    "NEBOSH",
    "IOSH",
    "OSHA",
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

  const normalizeCourse = (course) => {
    if (typeof course === "string") {
      return { name: course, image: "" };
    }
    return {
      name: course?.name || "",
      image: course?.image || "",
    };
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === "") {
      return "";
    }

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    let clean = imagePath;

    if (clean.startsWith("/uploads")) {
      clean = clean.replace("/uploads", "");
    }

    if (!clean.startsWith("/")) {
      clean = "/" + clean;
    }

    return `${API_upload}${clean}`;
  };

  useEffect(() => {
    const fetchConfig = async () => {
      if (!token) return;

      setLoading(true);

      try {
        const res = await axios.get(`${API_BASE}/admin/ohs-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let nextCourses = [];

        if (Array.isArray(res.data?.courses)) {
          nextCourses = res.data.courses.map((c) =>
            typeof c === "string" ? { name: c, image: "" } : c
          );
        }

        setCourses(nextCourses.length ? nextCourses : DEFAULT_COURSES);
        setDescription(res.data?.description || DEFAULT_DESCRIPTION);

        setContact({
          name: res.data?.name || DEFAULT_CONTACT.name,
          email: res.data?.email || DEFAULT_CONTACT.email,
          phone: res.data?.phone || DEFAULT_CONTACT.phone,
          address: res.data?.address || DEFAULT_CONTACT.address,
        });
      } catch (err) {
        toast.error("Failed to load courses");
        setCourses(DEFAULT_COURSES);
        setDescription(DEFAULT_DESCRIPTION);
        setContact(DEFAULT_CONTACT);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [token]);

  const chunkedCourses = useMemo(() => {
    const list = courses.map(normalizeCourse);
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
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
          Dashboard
        </Breadcrumb.Item>
        <Breadcrumb.Item active>OHS All Courses</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="mb-4 fw-semibold name_heading">
        OHS Academy - All Courses
      </h3>

      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : (
        chunkedCourses.map((chunk, i) => (
          <Row key={i} className="mb-3 g-3">
            {chunk.map((course, j) => {
              const name = course.name;
              const imageUrl = getImageUrl(course.image);
              const hasImage = imageUrl && imageUrl.trim() !== "";

              return (
                <Col xs={12} sm={6} md={4} key={j}>
                  <Card
                    className="shadow-sm border-0 border-start border-warning border-4 course-card"
                    style={{
                      borderRadius: "12px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCardClick(name)}
                  >
                    {/* IMAGE / ICON TOP */}
                    <div
                      style={{
                        height: "180px",
                        background: "#f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "15px",
                      }}
                    >
                      {hasImage ? (
                        <img
                          src={imageUrl}
                          alt={name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-center">
                          <LuImageOff
                            size={120}
                            style={{
                              padding: "16px",
                            }}
                          />
                          <div className="mt-2 text-muted small">
                            No Image
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TEXT BOTTOM */}
                    <Card.Body className="text-center fw-bold py-2">
                      {name}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ))
      )}

      {/* DESCRIPTION */}
      <h5 className="mt-3">Course Information</h5>

      <div className="description-scroll-box">
        <p className="mb-0">{description}</p>
      </div>

      {/* MODAL */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>{selectedCourse}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>{description}</p>

          <hr />

          <p>
            <b>Name:</b> {contact.name}
          </p>
          <p>
            <b>Email:</b> {contact.email}
          </p>
          <p>
            <b>Phone:</b> {contact.phone}
          </p>
          <p>
            <b>Address:</b> {contact.address}
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .course-card {
          transition: 0.3s;
        }

        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        }

        .description-scroll-box {
          max-height: 140px;
          overflow-y: auto;
          padding: 10px;
          background: #fff3cd;
          border-radius: 6px;
        }
      `}</style>
    </Container>
  );
};

export default List;