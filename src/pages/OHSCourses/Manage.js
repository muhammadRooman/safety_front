import React, { useEffect, useState } from "react";
import { 
  Breadcrumb, 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Modal, 
  Alert,
  Card 
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { MdDelete, MdEdit, MdAdd } from "react-icons/md";


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
  "Safety Management",
  "Fair Safety",
];

const DEFAULT_DESCRIPTION = "This course is designed to enhance your skills and knowledge in occupational health & safety.";
const DEFAULT_CONTACT = {
  name: "OHS Academy",
  email: "ohsacademy1@gmail.com",
  phone: "03429090753",
  address: "Main bazar sher ghar khattak plaza top floor peshawar",
};

export default function OhsCourseManage() {
  const token = useSelector((state) => state.auth.token);
  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [contact, setContact] = useState(DEFAULT_CONTACT);

  const [newCourseName, setNewCourseName] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);


  // Filtered Courses for Search
  const filteredCourses = courses.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase().trim())
  );
  const fetchInitialData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [userRes, configRes] = await Promise.all([
        axios.get(`${API_BASE}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/admin/ohs-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRole(userRes.data?.user?.role ?? null);
      setDescription(
        typeof configRes.data?.description === "string" && configRes.data.description.trim()
          ? configRes.data.description
          : DEFAULT_DESCRIPTION
      );
      setContact({
        name: configRes.data?.name || DEFAULT_CONTACT.name,
        email: configRes.data?.email || DEFAULT_CONTACT.email,
        phone: configRes.data?.phone || DEFAULT_CONTACT.phone,
        address: configRes.data?.address || DEFAULT_CONTACT.address,
      });

      const nextCourses = Array.isArray(configRes.data?.courses) 
        ? configRes.data.courses 
        : DEFAULT_COURSES;

      setCourses(nextCourses.length ? nextCourses : DEFAULT_COURSES);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load OHS config");
      setRole(null);
      setDescription(DEFAULT_DESCRIPTION);
      setCourses(DEFAULT_COURSES);
      setContact(DEFAULT_CONTACT);
    } finally {
      setLoading(false);
    }
  };

  const persistConfig = async (nextDesc, nextCourses, nextContact = contact) => {
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/admin/ohs-courses`,
        {
          description: nextDesc,
          courses: nextCourses,
          name: nextContact.name,
          email: nextContact.email,
          phone: nextContact.phone,
          address: nextContact.address,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDescription(nextDesc);
      setCourses(nextCourses);
      setContact(nextContact);
      toast.success("OHS courses updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  const isTeacher = role === "teacher";

  const addCourse = async () => {
    const name = String(newCourseName || "").trim();
    if (!name) return;

    if (courses.some((c) => String(c).toLowerCase() === name.toLowerCase())) {
      toast.error("This course already exists");
      return;
    }

    await persistConfig(description, [name, ...courses]);
    setNewCourseName("");
  };

  const startEdit = (idx) => {
    setEditIndex(idx);
    setEditValue(courses[idx] ?? "");
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    const nextName = String(editValue || "").trim();
    if (!nextName) {
      toast.error("Course name cannot be empty");
      return;
    }

    const nextCourses = [...courses];
    nextCourses[editIndex] = nextName;

    if (nextCourses.some((c, i) => i !== editIndex && String(c).toLowerCase() === nextName.toLowerCase())) {
      toast.error("Another course with the same name already exists");
      return;
    }

    setShowEditModal(false);
    setEditIndex(null);
    setEditValue("");
    await persistConfig(description, nextCourses);
  };

  const requestDelete = (idx) => {
    setDeleteIndex(idx);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (courses.length <= 1) {
      toast.error("At least one course should remain");
      setShowDeleteModal(false);
      return;
    }
    const nextCourses = courses.filter((_, i) => i !== deleteIndex);
    setShowDeleteModal(false);
    setDeleteIndex(null);
    await persistConfig(description, nextCourses);
  };

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>OHS Courses Manage</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 mb-0 fw-semibold name_heading">OHS Academy - Manage Courses</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading courses...</p>
        </div>
      ) : (
        <>
          {!isTeacher && (
            <Alert variant="warning" className="mb-4">
              <strong>Note:</strong> Only teachers can add, edit or delete courses. You can only view the list.
            </Alert>
          )}

          {/* Add New Course + Description Section */}
          <Row className="g-4 mb-5">
            {/* Add Course Card */}
            <Col lg={5}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  backgroundImage: "url('/newcourse.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <Card.Body
                  style={{
                    backgroundColor: "rgba(255,255,255,0.85)",
                    borderRadius: "8px",
                  }}
                >
                  <Card.Title className="d-flex align-items-center gap-2">
                    <MdAdd size={24} /> Add New Course
                  </Card.Title>
          
                  <Form
                    className="mt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCourse();
                    }}
                  >
                    <Form.Group>
                      <Form.Label>Course Name</Form.Label>
                      <Form.Control
                        placeholder="Enter course name (e.g. NEBOSH)"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        disabled={!isTeacher || saving}
                      />
                    </Form.Group>
          
                    <Button
                      variant="success"
                      className="mt-3 w-100"
                      onClick={addCourse}
                      disabled={!isTeacher || saving || !newCourseName.trim()}
                    >
                      Add Course
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Description Card */}
            <Col lg={7}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  background: "url('/more1.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <Card.Body
                  style={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    borderRadius: "8px",
                  }}
                >
                  <Card.Title>Course Information (Shared for all courses)</Card.Title>

                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Label className="mb-1">Name</Form.Label>
                      <Form.Control
                        value={contact.name}
                        onChange={(e) =>
                          setContact((prev) => ({ ...prev, name: e.target.value }))
                        }
                        disabled={!isTeacher || saving}
                        placeholder="Enter name..."
                      />
                    </Col>

                    <Col md={6}>
                      <Form.Label className="mb-1">Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          setContact((prev) => ({ ...prev, email: e.target.value }))
                        }
                        disabled={!isTeacher || saving}
                        placeholder="Enter email..."
                      />
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Label className="mb-1">Phone</Form.Label>
                      <Form.Control
                        value={contact.phone}
                        onChange={(e) =>
                          setContact((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        disabled={!isTeacher || saving}
                        placeholder="Enter phone..."
                      />
                    </Col>

                    <Col md={6}>
                      <Form.Label className="mb-1">Address</Form.Label>
                      <Form.Control
                        value={contact.address}
                        onChange={(e) =>
                          setContact((prev) => ({ ...prev, address: e.target.value }))
                        }
                        disabled={!isTeacher || saving}
                        placeholder="Enter address..."
                      />
                    </Col>
                  </Row>

                  <Form.Group className="mt-3">
                    <Form.Label className="mb-1">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isTeacher || saving}
                      placeholder="Enter description..."
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    className="mt-3"
                    onClick={() => persistConfig(description, courses, contact)}
                    disabled={!isTeacher || saving}
                  >
                    {saving ? "Saving Changes..." : "Save Description"}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Courses List Section */}
          <Card className="shadow-sm">
          <Card.Header className="bg-light py-3">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
              
              {/* Left Side - Title */}
              <div>
                <h5 className="mb-0 fw-semibold">All Courses ({filteredCourses.length})</h5>
             
              </div>
        
              {/* Right Side - Filter Section (Responsive) */}
            {/* Right Side - Filter Section */}
            <div className="d-flex flex-column flex-lg-row align-items-center justify-content-end gap-2 w-100">
            <span className="text-muted fw-medium text-nowrap">Filter by name:</span>
            
            <Form.Control
              type="text"
              placeholder="Search course..."
              value={search}
            onChange={(e) => setSearch(e.target.value)}
              style={{ width: "180px" }} 
            />
            
            {isTeacher && (
              <small className="text-success text-nowrap ms-2">You have full access</small>
            )}
          </div>
            </div>
          </Card.Header>
        
          <Card.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
            <Row className="g-3">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((courseName, idx) => {
                  const originalIndex = courses.findIndex(c => c === courseName);
                  
                  return (
                    <Col key={`${courseName}-${idx}`} md={6} lg={4}>
                      <Card className="h-100 border hover-shadow transition-all position-relative">
                        <span style={{
                          position: "absolute",
                          top: "10px",
                          right: "15px",
                          fontSize: "70px",
                          fontWeight: "bold",
                          color: "rgba(255, 193, 7, 0.2)",
                          pointerEvents: "none",
                          zIndex: 0,
                        }}>
                          {originalIndex + 1}
                        </span>
        
                        <Card.Body className="d-flex flex-column position-relative" style={{ zIndex: 1 }}>
                          <Card.Title className="fs-6 mb-3" style={{ wordBreak: "break-word" }}>
                            {courseName}
                          </Card.Title>
        
                          <div className="mt-auto d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => startEdit(originalIndex)}
                              disabled={!isTeacher || saving}
                            >
                              <MdEdit /> Edit
                            </Button>
        
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => requestDelete(originalIndex)}
                              disabled={!isTeacher || saving}
                            >
                              <MdDelete /> Delete
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })
              ) : (
                <Col xs={12}>
                  <p className="text-center text-muted py-5">
                    No courses found matching "<strong>{search}</strong>"
                  </p>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
        </>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Course Name</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>"{courses[deleteIndex]}"</strong>?<br />
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}