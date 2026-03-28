import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";

const backendOrigin = (process.env.REACT_APP_BASE_uploads || "http://localhost:8082").replace(/\/$/, "");

const TeacherInfoList = () => {
  const token = useSelector((state) => state.auth.token);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [userRole, setUserRole] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    media: null,
  });

  const isAdmin = useMemo(() => userRole === "teacher", [userRole]);

  const getMediaSrc = (fileName) => {
    if (!fileName) return "";
    return `${backendOrigin}/${fileName}`;
  };

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(res.data?.user?.role || "");
    } catch (error) {
      toast.error("Failed to load user profile");
    }
  };

  const fetchList = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/admin/teacher-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load teacher info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchList();
  }, [token]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ title: "", message: "", media: null });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item?.title || "",
      message: item?.message || "",
      media: null,
    });
    setShowModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editingItem && !form.media) {
      toast.error("Please upload image or video");
      return;
    }

    const body = new FormData();
    body.append("title", form.title.trim());
    body.append("message", form.message || "");
    if (form.media) body.append("media", form.media);

    setSubmitting(true);
    try {
      if (editingItem?._id) {
        await axios.put(
          `${process.env.REACT_APP_BASE_ADMIN_API}/admin/teacher-info/${editingItem._id}`,
          body,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Teacher info updated");
      } else {
        await axios.post(`${process.env.REACT_APP_BASE_ADMIN_API}/admin/teacher-info`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Teacher info created");
      }
      setShowModal(false);
      setEditingItem(null);
      setForm({ title: "", message: "", media: null });
      fetchList();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save teacher info");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!token || !id) return;
    const ok = window.confirm("Delete this item?");
    if (!ok) return;
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_ADMIN_API}/admin/teacher-info/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deleted successfully");
      fetchList();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete");
    }
  };

  const openPreview = (item) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0 fw-semibold">Teacher Info</h4>
        {isAdmin && (
          <Button className="buttonColor" onClick={openCreate}>
            Add Teacher Info
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row className="g-3">
          {items.length === 0 && (
            <Col xs={12}>
              <Card body className="text-muted">
                No teacher info available.
              </Card>
            </Col>
          )}

          {items.map((item) => (
            <Col xs={12} md={6} lg={4} key={item._id}>
              <Card
                className="h-100"
                role="button"
                onClick={() => openPreview(item)}
                style={{ cursor: "pointer" }}
              >
                {item.mediaType === "image" ? (
                  <Card.Img
                    variant="top"
                    src={getMediaSrc(item.mediaUrl)}
                    alt={item.title}
                    style={{ height: 220, objectFit: "cover" }}
                  />
                ) : (
                  <video
                    controls
                    src={getMediaSrc(item.mediaUrl)}
                    style={{ width: "100%", height: 220, objectFit: "cover" }}
                  />
                )}
                <Card.Body>
                  <Card.Title>{item.title}</Card.Title>
                  <Card.Text
                    style={{
                      whiteSpace: "pre-wrap",
                      maxHeight: 100,
                      overflowY: "auto",
                    }}
                  >
                    {item.message || "No message"}
                  </Card.Text>
                </Card.Body>
                {isAdmin && (
                  <Card.Footer className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(item);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item._id);
                      }}
                    >
                      Delete
                    </Button>
                  </Card.Footer>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={onSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingItem ? "Edit Teacher Info" : "Add Teacher Info"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>{editingItem ? "Replace media (optional)" : "Media (required)"}</Form.Label>
              <Form.Control
                type="file"
                accept="image/*,video/*"
                onChange={(e) =>
                  setForm((p) => ({ ...p, media: e.target.files?.[0] || null }))
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="buttonColor" disabled={submitting}>
              {submitting ? "Saving..." : editingItem ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{previewItem?.title || "Teacher Info"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewItem?.mediaType === "image" ? (
            <img
              src={getMediaSrc(previewItem?.mediaUrl)}
              alt={previewItem?.title || "Teacher info"}
              style={{ width: "100%", maxHeight: "75vh", objectFit: "contain" }}
            />
          ) : (
            <video
              controls
              src={getMediaSrc(previewItem?.mediaUrl)}
              style={{ width: "100%", maxHeight: "75vh" }}
            />
          )}

          <hr />
          <h5 className="mb-2">{previewItem?.title}</h5>
          <div
            style={{
              maxHeight: 180,
              overflowY: "auto",
              border: "1px solid #eee",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
              {previewItem?.message || "No message"}
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TeacherInfoList;
