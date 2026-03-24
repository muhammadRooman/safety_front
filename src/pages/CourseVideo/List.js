import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import { FaPlayCircle, FaDownload } from "react-icons/fa";   // ← Added FaDownload
import { MdDelete, MdEdit } from "react-icons/md";
import DataTable from "react-data-table-component";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  Modal,
  Breadcrumb,
  Badge,
  Tabs,
  Tab,
} from "react-bootstrap";

const COURSE_TYPES = [
  { value: "NEBOSH", label: "NEBOSH" },
  { value: "IOSH", label: "IOSH" },
  { value: "OSHA", label: "OSHA" },
  { value: "RIGGER3", label: "RIGGER3" },
];

export default function CourseVideoList() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [videos, setVideos] = useState([]);
  const [filterCourseType, setFilterCourseType] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Upload/Edit Modal States
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: "", courseType: "" });
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Delete Modal States
  const [delId, setDelId] = useState(null);
  const [showDelModal, setShowDelModal] = useState(false);

  // Video Player Modal States ← NEW
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState("");

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  // Fetch videos
  const fetchVideos = async () => {
    try {
      const url = filterCourseType
        ? `${API_BASE}/admin/courseVideo?courseType=${filterCourseType}`
        : `${API_BASE}/admin/courseVideo`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideos(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load videos");
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filterCourseType]);

  // Group videos by course for Tabs
  const courseOrder = COURSE_TYPES.map((c) => c.value);
  const byCourse = courseOrder.reduce((acc, course) => {
    acc[course] = videos.filter((v) => v.courseType === course);
    return acc;
  }, {});

  // Handle Upload / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.courseType) {
      toast.error("Title and Course type are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("courseType", uploadForm.courseType);
      if (videoFile) formData.append("video", videoFile);

      if (editMode && editId) {
        await axios.put(`${API_BASE}/admin/courseVideo/${editId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Video updated successfully");
      } else {
        await axios.post(`${API_BASE}/admin/courseVideo`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Video uploaded successfully");
      }

      setShowModal(false);
      resetForm();
      fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.message || (editMode ? "Update failed" : "Upload failed"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUploadForm({ title: "", courseType: "" });
    setVideoFile(null);
    setEditId(null);
    setEditMode(false);
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!delId) return;
    try {
      await axios.delete(`${API_BASE}/admin/courseVideo/${delId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Video deleted successfully");
      setShowDelModal(false);
      setDelId(null);
      fetchVideos();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // DataTable Columns
  const columns = [
    { name: "#", cell: (row, i) => i + 1, width: "60px" },
    { name: "Title", selector: (row) => row.title, sortable: true },
    {
      name: "Course",
      cell: (row) => (
        <Badge
          style={{
            padding: "7px 15px",
            fontSize: "12px",
            borderRadius: "8px",
            display: "inline-block",
            minWidth: "80px",
            textAlign: "center",
          }}
          bg="primary"
        >
          {row.courseType}
        </Badge>
      ),
    },
    {
      name: "Videos",
      cell: (row) => {
        const videoUrl = `${process.env.REACT_APP_BASE_uploads}/${row.videoUrl}`;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <FaPlayCircle
              size={28}
              style={{ cursor: "pointer", color: "#28a745" }}
              onClick={() => {
                setSelectedVideo(videoUrl);
                setShowVideoModal(true);
              }}
              title="Play Video"
            />

            
          </div>
        );
      },
    },
    {
      name: "Downloads",
      cell: (row) => {
        const videoUrl = `${process.env.REACT_APP_BASE_uploads}/${row.videoUrl}`;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            

            <a
              href={videoUrl}
              download
              rel="noopener noreferrer"
              title="Download Video"
              style={{ color: "#007bff", textDecoration: "none" }}
            >
              <FaDownload size={22}  title="Download Video"/>
            </a>
          </div>
        );
      },
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setEditId(row._id);
              setUploadForm({ title: row.title, courseType: row.courseType });
              setVideoFile(null);
              setEditMode(true);
              setShowModal(true);
            }}
          >
            <MdEdit size={22} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setDelId(row._id);
              setShowDelModal(true);
            }}
          >
            <MdDelete size={22} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Course Videos</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header 
      <Row className="mb-4 justify-content-between align-items-center">
        <Col>
          <h3 className="mb-0 fw-semibold">Course Videos</h3>
        </Col>
        <Col md="auto" className="d-flex gap-2">
          <Form.Select
            style={{ width: "160px" }}
            value={filterCourseType}
            onChange={(e) => setFilterCourseType(e.target.value)}
          >
            <option value="">All Courses</option>
            {COURSE_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Form.Select>

          <Button className="buttonColor" onClick={() => {
            resetForm();
            setShowModal(true);
          }}>
            <IoMdAdd /> Upload Video
          </Button>
        </Col>
      </Row>

*/}



      <Row className="mb-4 align-items-center justify-content-between">
      <Col xs={12} md="auto" className="mb-2 mb-md-0">
        <h3 className=" mb-0 fw-semibold name_heading">Course Videos</h3>
      </Col>
    <Col
xs={12}
md="auto"
className="d-flex gap-2 justify-content-end flex-nowrap"
>
<Form.Select
style={{ width: "160px" }}
value={filterCourseType}
onChange={(e) => setFilterCourseType(e.target.value)}
>
<option value="">All Courses</option>
{COURSE_TYPES.map((c) => (
  <option key={c.value} value={c.value}>
    {c.label}
  </option>
))}
</Form.Select>

<Button
  className="buttonColor px-3 d-flex align-items-center"
  onClick={() => {
    resetForm();
    setShowModal(true);
  }}
>
<IoMdAdd /> Upload Video
  <span className="ms-1 d-none d-sm-inline"></span>
</Button>
</Col>
    </Row>





      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "all")}
        className="mb-3"
        justify
      >
        <Tab eventKey="all" title={`All (${videos.length})`} />
        {courseOrder.map((c) =>
          byCourse[c]?.length > 0 ? (
            <Tab key={c} eventKey={c} title={`${c} (${byCourse[c].length})`} />
          ) : null
        )}
      </Tabs>

      {/* DataTable */}
      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={activeTab === "all" ? videos : byCourse[activeTab] || []}
            pagination
            highlightOnHover
            responsive
          />
        </Card.Body>
      </Card>

      {/* Upload / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" keyboard={false}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Edit Video" : "Upload New Video"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Enter video title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course Type <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Select
                value={uploadForm.courseType}
                onChange={(e) => setUploadForm((p) => ({ ...p, courseType: e.target.value }))}
                required
              >
                <option value="">Select Course</option>
                {COURSE_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Video File {editMode ? "(Leave empty to keep current)" : "(Required)"}
              </Form.Label>
              <Form.Control
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required={!editMode}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="buttonColor" disabled={loading}>
              {loading ? (editMode ? "Updating..." : "Uploading...") : editMode ? "Update" : "Upload"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDelModal} onHide={() => setShowDelModal(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this video? This action cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        show={showVideoModal}
        onHide={() => setShowVideoModal(false)}
        centered
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Video Player</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedVideo && (
            <video
              controls
              autoPlay
              style={{ width: "100%", height: "auto", maxHeight: "70vh" }}
            >
              <source src={selectedVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVideoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}