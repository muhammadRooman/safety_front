import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
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
          interfaceConfigOverwrite: {
            TILE_VIEW_MAX_COLUMNS: 3,
          },
          configOverwrite: {
            // Auto-join so student can immediately see host tiles.
            prejoinPageEnabled: false,
          },
          userInfo: {
            displayName: displayName || "Host",
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      })
      .catch((err) => {
        console.error("Failed to init Jitsi", err);
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

  const handleDeleteClass = async (cls) => {
    const ok = window.confirm(`Delete class "${cls.title}"?`);
    if (!ok) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/${cls._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Class deleted");
      if (joiningClass && joiningClass._id === cls._id) {
        setJoiningClass(null);
      }
      fetchClasses();
    } catch (err) {
      console.error("Failed to delete class", err);
      toast.error(err?.response?.data?.message || "Failed to delete class");
    }
  };
const formatTime = (time) => {
  const [hour, minute] = time.split(":");
  let h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12;
  h = h === 0 ? 12 : h; // 0 ko 12 bana do

  return `${h}:${minute} ${ampm}`;
};
  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Live Class (Admin)</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-3">
        <Col lg={5}>
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Create Live Class</Card.Title>
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
                <Form.Group className="mb-3">
                  <Form.Label>Assign students</Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    value={form.allowedStudentIds}
                    onChange={handleStudentSelect}
                    style={{ minHeight: 120 }}
                  >
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </Form.Control>
                  <Form.Text muted>
                    Only selected students will see and join this live class.
                  </Form.Text>
                </Form.Group>
                <Button type="submit" disabled={creating}>
                  {creating ? <Spinner size="sm" animation="border" /> : "Save"}
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
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={fetchClasses}
                >
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
                <div className="d-flex flex-column gap-2">
                  {classes.map((cls) => (
                    <div
                      key={cls._id}
                      className="d-flex flex-wrap justify-content-between align-items-center border rounded px-2 py-1"
                    >
                      <div>
                        <div className="fw-semibold">{cls.title}  <Badge>
  {formatTime(cls.startTime)} to {formatTime(cls.endTime)}
</Badge></div>
                        <small className="text-muted">
                          Room: {cls.roomName} •{" "}
                          <Badge
                            bg={
                              cls.status === "live"
                                ? "success"
                                : cls.status === "scheduled"
                                ? "secondary"
                                : cls.status === "ended"
                                ? "dark"
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
                          onClick={() => handleDeleteClass(cls)}
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
              <Card.Title className="mb-2">
                Live Class Room (Jitsi)
              </Card.Title>
              {!joiningClass ? (
                <p className="text-muted mb-0">
                  Select a class above and click <strong>Open</strong> or{" "}
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
    </Container>
  );
}

