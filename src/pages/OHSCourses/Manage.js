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
  "NEBOSH", "IOSH", "OSHA", "Rigger 1", "Rigger 2", "Rigger 3",
  "Risk Assessment", "First Aid", "Fire Safety", "Safety Management",
  "Electrical Safety", "Construction Safety", "Confined Space Training",
  "Lifting & Rigging Safety", "Chemical Handling Safety"
];

const DEFAULT_DESCRIPTION = "This course is designed to enhance your skills and knowledge in occupational health & safety.";

export default function OhsCourseManage() {
  const token = useSelector((state) => state.auth.token);
  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [courses, setCourses] = useState(DEFAULT_COURSES);

  // Add course
  const [newCourseName, setNewCourseName] = useState("");

  // Edit course
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Delete course
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

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

      const nextCourses = Array.isArray(configRes.data?.courses) 
        ? configRes.data.courses 
        : DEFAULT_COURSES;

      setCourses(nextCourses.length ? nextCourses : DEFAULT_COURSES);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load OHS config");
      setRole(null);
      setDescription(DEFAULT_DESCRIPTION);
      setCourses(DEFAULT_COURSES);
    } finally {
      setLoading(false);
    }
  };

  const persistConfig = async (nextDesc, nextCourses) => {
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/admin/ohs-courses`,
        { description: nextDesc, courses: nextCourses },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDescription(nextDesc);
      setCourses(nextCourses);
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
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>OHS Courses Manage</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 fw-bold text-primary">OHS Academy - Manage Courses</h2>

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
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center gap-2">
                    <MdAdd size={24} /> Add New Course
                  </Card.Title>
                  <Form className="d-flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); addCourse(); }}>
                    <Form.Control
                      placeholder="Enter course name (e.g. NEBOSH)"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      disabled={!isTeacher || saving}
                    />
                    <Button 
                      variant="success" 
                      onClick={addCourse} 
                      disabled={!isTeacher || saving || !newCourseName.trim()}
                    >
                      Add
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Description Card */}
            <Col lg={7}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>Course Description (Shared for all courses)</Card.Title>
                  <Form.Group className="mt-3">
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
                    onClick={() => persistConfig(description, courses)}
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
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">All Courses ({courses.length})</h5>
                  <small className="text-muted">Click edit or delete icons to modify</small>
                </div>
                {isTeacher && (
                  <small className="text-success">You have full access</small>
                )}
              </div>
            </Card.Header>

            <Card.Body>
              <Row className="g-3">
                {courses.map((name, idx) => (
                  <Col key={`${name}-${idx}`} md={6} lg={4}>
                    <Card className="h-100 border hover-shadow transition-all">
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="fs-6 mb-3" style={{ wordBreak: "break-word" }}>
                          {name}
                        </Card.Title>

                        <div className="mt-auto d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => startEdit(idx)}
                            disabled={!isTeacher || saving}
                            title="Edit Course"
                          >
                            <MdEdit /> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => requestDelete(idx)}
                            disabled={!isTeacher || saving}
                            title="Delete Course"
                          >
                            <MdDelete /> Delete
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
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