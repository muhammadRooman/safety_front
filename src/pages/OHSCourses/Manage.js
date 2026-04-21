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
  Card,
  Image 
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { MdDelete, MdEdit, MdAdd } from "react-icons/md";
import { ENV } from "../../config/config";
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
  const API_upload = process.env.REACT_APP_BASE_uploads;

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [courses, setCourses] = useState([]);
  const [contact, setContact] = useState(DEFAULT_CONTACT);

  // Add New Course
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseImageFile, setNewCourseImageFile] = useState(null);
  const [newCourseImagePreview, setNewCourseImagePreview] = useState("");

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const filteredCourses = courses.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase().trim())
  );

  const fetchInitialData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [userRes, configRes] = await Promise.all([
        axios.get(`${API_BASE}/auth/userDetails`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/ohs-courses`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setRole(userRes.data?.user?.role ?? null);
      setDescription(configRes.data?.description || DEFAULT_DESCRIPTION);
      setContact({
        name: configRes.data?.name || DEFAULT_CONTACT.name,
        email: configRes.data?.email || DEFAULT_CONTACT.email,
        phone: configRes.data?.phone || DEFAULT_CONTACT.phone,
        address: configRes.data?.address || DEFAULT_CONTACT.address,
      });

      let loadedCourses = Array.isArray(configRes.data?.courses) ? configRes.data.courses : [];
      
      // Backward compatibility
      if (loadedCourses.length && typeof loadedCourses[0] === "string") {
        loadedCourses = loadedCourses.map(name => ({ name: String(name).trim(), image: "" }));
      }

      setCourses(loadedCourses);
    } catch (err) {
      toast.error("Failed to load OHS config");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== PERSIST CONFIG (Image Support) ====================
  const persistConfig = async (nextDesc, nextCourses, nextContact = contact) => {
    setSaving(true);
    try {
      const formData = new FormData();

      formData.append("description", String(nextDesc || ""));
      formData.append("name", String(nextContact.name || ""));
      formData.append("email", String(nextContact.email || ""));
      formData.append("phone", String(nextContact.phone || ""));
      formData.append("address", String(nextContact.address || ""));
      formData.append("courses", JSON.stringify(nextCourses || []));

      // New Course Image
      if (newCourseImageFile) {
        formData.append("courseImage", newCourseImageFile);
        formData.append("imageIndex", "0"); // New course is always added at index 0
      }

      // Edit Course Image
      if (editImageFile && editIndex !== null) {
        formData.append("courseImage", editImageFile);
        formData.append("imageIndex", String(editIndex));
      }

      const response = await axios.put(`${API_BASE}/admin/ohs-courses`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update state with response data if available
      const updatedData = response.data;
      
      setDescription(updatedData?.description || nextDesc);
      setCourses(updatedData?.courses || nextCourses);
      setContact({
        name: updatedData?.name || nextContact.name,
        email: updatedData?.email || nextContact.email,
        phone: updatedData?.phone || nextContact.phone,
        address: updatedData?.address || nextContact.address,
      });

      // Clear image states
      setNewCourseImageFile(null);
      setNewCourseImagePreview("");
      setEditImageFile(null);
      setEditImagePreview("");

      toast.success("OHS courses updated successfully");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  const isTeacher = role === "teacher";

  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCourseImageFile(file);
      setNewCourseImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const addCourse = async () => {
    const name = newCourseName.trim();
    if (!name) return toast.error("Course name is required");

    if (courses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return toast.error("This course already exists");
    }

    // Create new course with preview image
    const newCourse = { 
      name, 
      image: newCourseImagePreview || "" // Use preview as temporary display
    };
    const updatedCourses = [newCourse, ...courses];

    // Call persist which will upload and get the real image URL from backend
    await persistConfig(description, updatedCourses, contact);

    setNewCourseName("");
  };

  const startEdit = (idx) => {
    const course = courses[idx];
    setEditIndex(idx);
    setEditValue(course.name);
    // Convert the stored image path to full URL for display
    setEditImagePreview(course.image && course.image.trim() !== "" ? getImageUrl(course.image) : "");
    setEditImageFile(null);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    const nextName = editValue.trim();
    if (!nextName) return toast.error("Course name cannot be empty");

    const nextCourses = [...courses];
    nextCourses[editIndex] = { ...nextCourses[editIndex], name: nextName };

    if (nextCourses.some((c, i) => i !== editIndex && c.name.toLowerCase() === nextName.toLowerCase())) {
      return toast.error("Another course with same name already exists");
    }

    setShowEditModal(false);
    await persistConfig(description, nextCourses, contact);
  };

  const requestDelete = (idx) => {
    setDeleteIndex(idx);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (courses.length <= 1) return toast.error("At least one course should remain");
    const nextCourses = courses.filter((_, i) => i !== deleteIndex);
    setShowDeleteModal(false);
    await persistConfig(description, nextCourses, contact);
  };

  // Get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath.trim() === "") {
    return "/newcourse.jpg";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  const baseUrl = API_upload; // http://localhost:8082/uploads

  // IMPORTANT: remove leading /uploads if already included
  let cleanPath = imagePath;

  if (cleanPath.startsWith("/uploads")) {
    cleanPath = cleanPath.replace("/uploads", "");
  }

  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  const finalUrl = `${baseUrl}${cleanPath}`;

  return finalUrl;
};
  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>OHS Courses Manage</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 fw-semibold name_heading">OHS Academy - Manage Courses</h2>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading courses...</p>
        </div>
      ) : (
        <>
          {!isTeacher && (
            <Alert variant="warning" className="mb-4">
              <strong>Note:</strong> Only teachers can add, edit or delete courses.
            </Alert>
          )}

          <Row className="g-4 mb-5">
            {/* Add New Course */}
            <Col lg={5}>
              <Card className="h-100 shadow-sm" style={{ backgroundImage: "url('/newcourse.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
                <Card.Body style={{ backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "8px" }}>
                  <Card.Title className="d-flex align-items-center gap-2">
                    <MdAdd size={24} /> Add New Course
                  </Card.Title>

                  <Form className="mt-3" onSubmit={(e) => { e.preventDefault(); addCourse(); }}>
                    <Form.Group className="mb-3">
                      <Form.Label>Course Name</Form.Label>
                      <Form.Control
                        placeholder="Enter course name (e.g. NEBOSH)"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        disabled={!isTeacher || saving}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Course Image (Optional)</Form.Label>
                      <Form.Control 
                        type="file" 
                        accept="image/*" 
                        onChange={handleNewImageChange}
                        disabled={!isTeacher || saving}
                      />
                      {newCourseImagePreview && (
                        <Image src={newCourseImagePreview} fluid rounded className="mt-2" style={{ maxHeight: "160px" }} />
                      )}
                    </Form.Group>

                    <Button variant="success" className="w-100" onClick={addCourse} 
                      disabled={!isTeacher || saving || !newCourseName.trim()}>
                      Add Course
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Description & Contact */}
            <Col lg={7}>
              <Card className="h-100 shadow-sm" style={{ background: "url('/more1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
                <Card.Body style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "8px" }}>
                  <Card.Title>Course Information (Shared for all courses)</Card.Title>

                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Label className="mb-1">Name</Form.Label>
                      <Form.Control value={contact.name} onChange={(e) => setContact(p => ({...p, name: e.target.value}))} disabled={!isTeacher || saving} />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="mb-1">Email</Form.Label>
                      <Form.Control type="email" value={contact.email} onChange={(e) => setContact(p => ({...p, email: e.target.value}))} disabled={!isTeacher || saving} />
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Label className="mb-1">Phone</Form.Label>
                      <Form.Control value={contact.phone} onChange={(e) => setContact(p => ({...p, phone: e.target.value}))} disabled={!isTeacher || saving} />
                    </Col>
                    <Col md={6}>
                      <Form.Label className="mb-1">Address</Form.Label>
                      <Form.Control value={contact.address} onChange={(e) => setContact(p => ({...p, address: e.target.value}))} disabled={!isTeacher || saving} />
                    </Col>
                  </Row>

                  <Form.Group className="mt-3">
                    <Form.Label className="mb-1">Description</Form.Label>
                    <Form.Control as="textarea" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isTeacher || saving} />
                  </Form.Group>

                  <Button variant="primary" className="mt-3" onClick={() => persistConfig(description, courses, contact)} 
                    disabled={!isTeacher || saving}>
                    {saving ? "Saving Changes..." : "Save Description & Contact"}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Courses List */}
   <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "16px", overflow: "hidden" }}>
  <Card.Header className="bg-white border-0 py-4">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
      <h4 className="mb-0 fw-semibold text-dark">
        All Courses <span className="text-muted fs-5">({filteredCourses.length})</span>
      </h4>
      
      <Form.Control
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-pill"
        style={{ width: "260px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      />
    </div>
  </Card.Header>

  <Card.Body className="p-4" style={{ maxHeight: "580px", overflowY: "auto" }}>
    <Row className="g-4">
      {filteredCourses.length > 0 ? (
        filteredCourses.map((course) => {
          const originalIndex = courses.findIndex((c) => c.name === course.name);
          
          const imageSrc = course.image && course.image.trim() !== ""
            ? getImageUrl(course.image)
            : "/newcourse.jpg";

          return (
            <Col key={course.name} md={6} lg={4} xl={3}>
              <Card
                className="h-100 border-0 course-card"
                style={{
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
                }}
              >
                {/* ==================== IMAGE SECTION (Full Image - No Zoom) ==================== */}
                <div 
                  className="position-relative d-flex align-items-center justify-content-center"
                  style={{ 
                    height: "210px", 
                    background: "#f8f9fa",
                    padding: "12px",        // Thoda padding for better look with contain
                    overflow: "hidden"
                  }}
                >
                  <img
                    src={imageSrc}
                    alt={course.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",     // ← Changed to contain (full image dikhega)
                      objectPosition: "center",
                      transition: "transform 0.4s ease",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/newcourse.jpg";
                    }}
                  />
                  
                  {/* Optional subtle hover overlay */}
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 opacity-0 transition-all"
                    style={{ 
                      background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
                      pointerEvents: "none"
                    }}
                  />
                </div>

                {/* Content */}
                <Card.Body className="d-flex flex-column p-4">
                  <Card.Title 
                    className="fs-5 fw-semibold mb-3 text-dark line-clamp-2" 
                    style={{ minHeight: "52px" }}
                  >
                    {course.name}
                  </Card.Title>

                  <div className="d-flex gap-2 mt-auto">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill rounded-pill fw-medium"
                      onClick={() => startEdit(originalIndex)}
                      disabled={!isTeacher || saving}
                    >
                      <MdEdit className="me-1" /> Edit
                    </Button>

                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="flex-fill rounded-pill fw-medium"
                      onClick={() => requestDelete(originalIndex)}
                      disabled={!isTeacher || saving || courses.length <= 1}
                    >
                      <MdDelete className="me-1" /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })
      ) : (
        <Col xs={12}>
          <div className="text-center py-5 text-muted">
            <h5>No courses found</h5>
            <p>Try adjusting your search term</p>
          </div>
        </Col>
      )}
    </Row>
  </Card.Body>
</Card>
        </>
      )}

      {/* Edit Modal */}
     <Modal 
  show={showEditModal} 
  onHide={() => setShowEditModal(false)} 
  centered 
  size="lg"   // Thoda bada modal better dikhega images ke liye
>
  <Modal.Header closeButton>
    <Modal.Title>Edit Course</Modal.Title>
  </Modal.Header>

  <Modal.Body className="p-4">
    {/* Course Name - Top pe */}
    <Form.Group className="mb-4">
      <Form.Label className="fw-semibold">Course Name</Form.Label>
      <Form.Control 
        value={editValue} 
        onChange={(e) => setEditValue(e.target.value)} 
        autoFocus 
        placeholder="Enter course name"
      />
    </Form.Group>

    {/* Current Image Section */}
    <Form.Group className="mb-4">
      <Form.Label className="fw-semibold">Current Image</Form.Label>
      <div className="d-flex justify-content-center mt-2">
        {editImagePreview ? (
          <div className="text-center">
            <Image 
              src={editImagePreview} 
              fluid 
              rounded 
              style={{ 
                maxHeight: "240px", 
                maxWidth: "100%", 
                objectFit: "contain",
                border: "1px solid #dee2e6"
              }} 
            />
            <p className="text-muted small mt-2 mb-0">Current Image</p>
          </div>
        ) : (
          <div className="p-5 bg-light rounded text-center w-100" style={{ maxHeight: "240px" }}>
            <p className="text-muted mb-0">No image uploaded yet</p>
          </div>
        )}
      </div>
    </Form.Group>

    {/* Change Image Section - Last mein */}
    <Form.Group className="mb-3">
      <Form.Label className="fw-semibold">Change Image (Optional)</Form.Label>
      <Form.Control 
        type="file" 
        accept="image/*" 
        onChange={handleEditImageChange} 
      />
      
      {/* New Image Preview - Center + Last */}
      {/* {editImageFile && (
        <div className="mt-4 text-center">
          <p className="small text-success fw-medium mb-2">New Image Preview:</p>
          <div className="d-flex justify-content-center">
            <Image 
              src={URL.createObjectURL(editImageFile)} 
              fluid 
              rounded 
              style={{ 
                maxHeight: "240px", 
                maxWidth: "100%", 
                objectFit: "contain",
                border: "2px dashed #0d6efd"
              }} 
            />
          </div>
        </div>
      )} */}
    </Form.Group>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={saveEdit} disabled={saving}>
      {saving ? "Saving..." : "Save Changes"}
    </Button>
  </Modal.Footer>
</Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>"{courses[deleteIndex]?.name}"</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Yes, Delete</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}