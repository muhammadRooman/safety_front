import React, { useEffect, useState } from "react";
import { Breadcrumb, Container, Row, Col, Form, Button, Modal, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { MdDelete, MdEdit } from "react-icons/md";

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
  "Electrical Safety",
  "Construction Safety",
  "Confined Space Training",
  "Lifting & Rigging Safety",
  "Chemical Handling Safety",
];

const DEFAULT_DESCRIPTION =
  "This course is designed to enhance your skills and knowledge in occupational health & safety.";

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

      const nextCourses = Array.isArray(configRes.data?.courses) ? configRes.data.courses : DEFAULT_COURSES;
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
      toast.success("OHS courses updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isTeacher = role === "teacher";

  const addCourse = async () => {
    const name = String(newCourseName || "").trim();
    if (!name) return;

    const exists = courses.some((c) => String(c).toLowerCase() === name.toLowerCase());
    if (exists) {
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

    // Prevent duplicates after edit
    const dup = nextCourses.some(
      (c, i) => i !== editIndex && String(c).toLowerCase() === nextName.toLowerCase()
    );
    if (dup) {
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
      toast.error("At least one course should exist");
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
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>OHS Courses Manage</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="mb-4 fw-semibold name_heading">OHS Academy - Manage Courses</h3>

      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : (
        <>
          {!isTeacher && (
            <Alert variant="warning">
              Only teacher can add/edit/delete OHS courses. You can view the current list.
            </Alert>
          )}

          <Row>
          <Col md={5}>
            <CardSectionTitle title="Add Course Name" />

            <Form className="d-flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Form.Control
                placeholder="e.g. NEBOSH"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                disabled={!isTeacher || saving}
              />
              <Button variant="success" onClick={addCourse} disabled={!isTeacher || saving}>
                Add
              </Button>
            </Form>
          </Col>
        </Row>

          <Row className="g-3 mt-3">
            <Col md={7}>
              <Form.Group controlId="ohsDescription" className="mb-3">
                <Form.Label>Single Description (shared for all courses)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isTeacher || saving}
                />
              </Form.Group>

              <Button
                variant="primary"
                onClick={() => persistConfig(description, courses)}
                disabled={!isTeacher || saving}
              >
                {saving ? "Saving..." : "Save Description & Courses"}
              </Button>
            </Col>

           
          </Row>
         

          <hr className="my-4" />

          <Row>
            <Col>
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h5 className="mb-0">Course Names</h5>
                  <small className="text-muted">{courses.length} items</small>
                </div>
              </div>

              <Row className="mt-3 g-3">
                {courses.map((name, idx) => (
                  <Col key={`${name}-${idx}`} md={4}>
                    <div className="border rounded px-3 py-3 h-100 d-flex flex-column justify-content-between">
                      <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{name}</div>
                      <div className="d-flex gap-2 mt-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => startEdit(idx)}
                          disabled={!isTeacher || saving}
                        >
                          <MdEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => requestDelete(idx)}
                          disabled={!isTeacher || saving}
                        >
                          <MdDelete />
                        </Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton className="bg-warning text-black">
          <Modal.Title>Edit Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={!isTeacher || saving}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveEdit} disabled={!isTeacher || saving}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Delete Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this course name?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={!isTeacher || saving}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

function CardSectionTitle({ title }) {
  return (
    <div className="mb-2">
      <h5 className="mb-0">{title}</h5>
    </div>
  );
}

