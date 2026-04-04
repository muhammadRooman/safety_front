import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { FaChevronDown } from "react-icons/fa";
import {
  Container,
  Breadcrumb,
  Card,
  Button,
  Row,
  Col,
  Form,
  Spinner,
  Badge,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";

const JITSI_DOMAIN = "meet.jit.si";

function useJitsi(roomName, displayName) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi script"));
        document.body.appendChild(script);
      });

    let isMounted = true;

    loadScript()
      .then(() => {
        if (!isMounted || !containerRef.current) return;
        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }

        const options = {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: {
            displayName: displayName || "Host",
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithVideoMuted: false,
            startWithAudioMuted: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TILE_VIEW_MAX_COLUMNS: 3,
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      })
      .catch((err) => {
        console.error("Failed to init Jitsi", err);
        toast.error("Failed to load Jitsi");
      });

    return () => {
      isMounted = false;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName]);

  return containerRef;
}

export default function AdminLiveClass() {
  const token = useSelector((state) => state.auth.token);
  const teacherName = useSelector((state) => state.auth.name);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningClass, setJoiningClass] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    allowedStudentIds: [],
  });

  const jitsiRef = useJitsi(joiningClass?.roomName || null, teacherName);
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const list = Array.isArray(res.data.users)
        ? res.data.users.filter((u) => u.role === "student")
        : [];
      setStudents(list);
    } catch (err) {
      console.error("Failed to load students", err);
      toast.error("Failed to load students");
    }
  }, [token]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/teacher`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClasses(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to load live classes", err);
      toast.error("Failed to load live classes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchStudents();
    fetchClasses();
  }, [token, fetchStudents, fetchClasses]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentSelect = (e) => {
    const options = Array.from(e.target.selectedOptions || []);
    const ids = options.map((o) => o.value);
    setForm((prev) => ({ ...prev, allowedStudentIds: ids }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startTime || !form.endTime) {
      toast.error("Title, start and end time are required");
      return;
    }
    try {
      setCreating(true);
      await axios.post(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Live class scheduled");
      setForm({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        allowedStudentIds: [],
      });
      fetchClasses();
    } catch (err) {
      console.error("Failed to create live class", err);
      toast.error(
        err?.response?.data?.message || "Failed to schedule live class"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSetStatus = async (cls, status) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/${cls._id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(`Class marked as ${status}`);
      if (status === "live") {
        setJoiningClass({ ...cls, status: "live" });
      } else if (joiningClass && joiningClass._id === cls._id) {
        setJoiningClass({ ...cls, status });
      }
      fetchClasses();
    } catch (err) {
      console.error("Failed to update class status", err);
      toast.error("Failed to update class status");
    }
  };

  const handleOpenDeleteModal = (cls) => {
    setClassToDelete(cls);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/${classToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Class deleted");
      if (joiningClass && joiningClass._id === classToDelete._id) {
        setJoiningClass(null);
      }
      fetchClasses();
    } catch (err) {
      console.error("Failed to delete class", err);
      toast.error(err?.response?.data?.message || "Failed to delete class");
    } finally {
      setShowDeleteModal(false);
      setClassToDelete(null);
    }
  };

  const formatDateTime = (time) => {
    const d = new Date(time);
    return d.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  function getClassAssignedStudents(cls, studentsList) {
    const raw = cls.allowedStudents || [];
    return raw
      .map((entry) => {
        let id = "";
        let name = "";
        let email = "";

        if (entry && typeof entry === "object") {
          if (entry._id != null) id = String(entry._id);
          if (entry.name != null && String(entry.name).trim())
            name = String(entry.name).trim();
          if (entry.email != null && String(entry.email).trim())
            email = String(entry.email).trim();
        } else if (entry != null && entry !== "") {
          id = String(entry);
        }

        const u = id ? studentsList.find((s) => String(s._id) === id) : null;
        if (u) {
          if (!name && u.name) name = String(u.name).trim();
          if (!email && u.email) email = String(u.email).trim();
        }

        if (!name && !email) return null;
        return { id: id || email || name, name, email };
      })
      .filter(Boolean);
  }

  return (
    <Container className="py-4" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Live Class (Admin)</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-3">
      <h3 className=" mb-0 fw-semibold name_heading"> Live Class (Admin)</h3>
        <Col lg={5}>
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Create Live Session</Card.Title>
              <Form onSubmit={handleCreate}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. NEBOSH Live Session"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Start time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>End time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  👨‍🎓 Assign Student
                </Form.Label>
              
                <div  className="custom-student-select position-relative p-3 rounded-3 shadow-sm">
                  <Form.Select
                    value={form.allowedStudentIds || ""}
                    onChange={(e) =>
                      setForm({ ...form, allowedStudentIds: e.target.value })
                    }
                    className="border-0 pe-5"
                    style={{ background: "transparent", appearance: "none" }}
                  >
                    <option value="">-- Select Student --</option>
              
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} — {s.email}
                      </option>
                    ))}
                  </Form.Select>
              
                  {/* Dropdown Icon */}
                  <FaChevronDown
                    className="position-absolute"
                    style={{
                      right: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#555",
                    }}
                  />
                </div>
              
                {/* Selected Student */}
                {form.allowedStudentIds && (
                  <div className="mt-3 d-flex flex-wrap gap-2" >
                    {students
                      .filter((s) => s._id === form.allowedStudentIds)
                      .map((s) => (
                        <span
                          key={s._id}
                          className="badge bg-success px-3 py-2 rounded-pill"
                        >
                          ✅ {s.name}
                        </span>
                      ))}
                  </div>
                )}
              
                <Form.Text className="text-muted">
                  Only selected student will see and join this live class.
                </Form.Text>
              
                <style jsx>{`
                  .custom-student-select {
                    background: linear-gradient(135deg, #fff3cd, #ffe69c);
                    border: 1px solid #ffe69c;
                  }
              
                  .custom-student-select select:focus {
                    outline: none;
                    box-shadow: none;
                  }
                `}</style>
              </Form.Group>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Card.Title className="mb-0">Your Live Classes</Card.Title>
                <Button size="sm" variant="outline-secondary" onClick={fetchClasses}>
                  Refresh
                </Button>
              </div>
              {loading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" />
                </div>
              ) : classes.length === 0 ? (
                <p className="text-muted mb-0">No classes yet.</p>
              ) : (
                <div
                  className="d-flex flex-column gap-2"
                  style={{ maxHeight: "270px", overflowY: "auto" }}
                >
                  {[...classes]
                    .sort((a, b) => {
                      if (a.status === "live" && b.status !== "live") return -1;
                      if (a.status !== "live" && b.status === "live") return 1;
                      return new Date(a.startTime) - new Date(b.startTime);
                    })
                    .map((cls) => (
                      <div
                        key={cls._id}
                        className="d-flex flex-wrap justify-content-between align-items-center border rounded px-2 py-1"
                      >
                        <div>
                          <span className="fw-semibold text-body">Course Title:</span>{" "}
                          <span>{cls.title}</span>
                          <div className="fw-semibold">
                            Class Time:{" "}
                            <Badge bg="light" text="success" className="me-1">
                              {formatDateTime(cls.startTime)}
                            </Badge>
                            <span className="mx-1">to</span>
                            <Badge bg="light" text="danger">
                              {formatDateTime(cls.endTime)}
                            </Badge>
                          </div>

                          <small className="text-muted d-block">
                            <span className="fw-semibold text-body">Meeting URL :</span>{" "}
                            {cls.meetingUrl} •{" "}
                            <Badge
                              bg={
                                cls.status === "live"
                                  ? "success"
                                  : cls.status === "scheduled"
                                  ? "primary"
                                  : cls.status === "ended"
                                  ? "danger"
                                  : "danger"
                              }
                            >
                              {cls.status}
                            </Badge>
                          </small>
                        </div>

                        <div className="d-flex gap-2 mt-1 mt-sm-0">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => setJoiningClass(cls)}
                          >
                            Test Room
                          </Button>
                          {cls.status !== "live" && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleSetStatus(cls, "live")}
                            >
                              Start Live
                            </Button>
                          )}
                          {cls.status === "live" && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleSetStatus(cls, "ended")}
                            >
                              End
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleOpenDeleteModal(cls)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card.Body>
          </Card>

          <Card style={{ minHeight: 320 }}>
            <Card.Body>
              <Card.Title className="mb-2">Live Class Room (Jitsi)</Card.Title>
              {!joiningClass ? (
                <p className="text-muted mb-0">
                  Select a class above and click <strong>Test Room</strong> or{" "}
                  <strong>Start Live</strong>.
                </p>
              ) : (
                <div
                  ref={jitsiRef}
                  style={{ width: "100%", height: 400, borderRadius: 8 }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{classToDelete?.title}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}