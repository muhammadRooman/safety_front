import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import { FaPlayCircle, FaDownload } from "react-icons/fa";   // ← Added FaDownload
import { MdDelete, MdEdit } from "react-icons/md";
import DataTable from "react-data-table-component";
import axios from "axios";
import { toast } from "react-toastify";
import { FaFilePdf } from "react-icons/fa6";
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
  ProgressBar,
} from "react-bootstrap";

const VIDEO_LANGUAGES = [
  { value: "Urdu", label: "Urdu" },
  { value: "English", label: "English" },
  { value: "Arabic", label: "Arabic" },
  { value: "Pashto", label: "Pashto" },
];

/** Above this size, upload in chunks (must stay under server COURSE_VIDEO_CHUNK_MAX_BYTES, default 24MB). */
const CHUNK_THRESHOLD_BYTES = 6 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

function formatBytes(n) {
  if (n == null || !Number.isFinite(n) || n < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const decimals = i === 0 || v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(decimals)} ${units[i]}`;
}

export default function CourseVideoList() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [courseTypes, setCourseTypes] = useState([]); // Dynamic courses from API
  const [videos, setVideos] = useState([]);
  const [filterCourseType, setFilterCourseType] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Upload/Edit Modal States
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: "", courseType: "", language: "English" });
  const [videoFile, setVideoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [managingMaterialFile, setManagingMaterialFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgressPct, setUploadProgressPct] = useState(null);
  /** Extra lines for loader: bytes, chunk index, phase label */
  const [uploadDetail, setUploadDetail] = useState(null);

  // Delete Modal States
  const [delId, setDelId] = useState(null);
  const [showDelModal, setShowDelModal] = useState(false);

  // Video Player Modal States ← NEW
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState("");

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  /** Avoid global full-screen loader on this page (local progress + toasts instead). */
  const noGlobalLoader = { showGlobalLoader: false };

  // Fetch dynamic courses from API
  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/ohs-courses`, {
        headers: { Authorization: `Bearer ${token}` },
        ...noGlobalLoader,
      });
      // Convert courses array to COURSE_TYPES format
      const courses = res.data?.courses || [];
      const formatted = courses.map((c) => ({
        value: c.name,
        label: c.name,
      }));
      setCourseTypes(formatted);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setCourseTypes([]);
    }
  };

  // Fetch videos
  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCourseType) params.set("courseType", filterCourseType);
      if (filterLanguage) params.set("language", filterLanguage);
      const qs = params.toString();
      const url = qs ? `${API_BASE}/admin/courseVideo?${qs}` : `${API_BASE}/admin/courseVideo`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        ...noGlobalLoader,
      });
      setVideos(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load videos");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [token]);

  useEffect(() => {
    fetchVideos();
  }, [filterCourseType, filterLanguage]);

  // Group videos by course for Tabs
  const courseOrder = courseTypes.map((c) => c.value);
  const byCourse = courseOrder.reduce((acc, course) => {
    acc[course] = videos.filter((v) => v.courseType === course);
    return acc;
  }, {});

  // Handle Upload / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.courseType || !uploadForm.language) {
      toast.error("Title, course type and language are required");
      return;
    }

    setLoading(true);
    setUploadProgressPct(0);
    setUploadDetail({
      phase: "preparing",
      loadedBytes: 0,
      totalBytes: videoFile?.size ?? 0,
      chunkCurrent: null,
      totalChunks: null,
    });
    try {
      const formData = new FormData();
      const lang = String(uploadForm.language || "English").trim();
      formData.append("title", uploadForm.title);
      formData.append("courseType", uploadForm.courseType);
      formData.append("language", lang);
      formData.append("videoLang", lang);
      if (videoFile) formData.append("video", videoFile);
      // Optional course attachment for students (PDF). If empty, backend keeps existing.
      if (pdfFile) formData.append("pdf", pdfFile);
      // Optional managing material file (PDF). If empty, backend keeps existing.
      if (managingMaterialFile) formData.append("managingMaterial", managingMaterialFile);

      // Do not set Content-Type manually — browser/axios must add multipart boundary.
      const authHeaders = { Authorization: `Bearer ${token}` };
      const langQ = encodeURIComponent(lang);
      const longRequest = {
        headers: authHeaders,
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        ...noGlobalLoader,
      };

      if (editMode && editId) {
        await axios.put(`${API_BASE}/admin/courseVideo/${editId}?language=${langQ}`, formData, {
          ...longRequest,
          onUploadProgress: (ev) => {
            if (!ev.total) return;
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgressPct(pct);
            setUploadDetail({
              phase: "upload",
              loadedBytes: ev.loaded,
              totalBytes: ev.total,
              chunkCurrent: null,
              totalChunks: null,
            });
          },
        });
        toast.success("Video updated successfully");
      } else if (videoFile && videoFile.size > CHUNK_THRESHOLD_BYTES) {
        const totalSize = videoFile.size;
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE_BYTES);
        setUploadDetail({
          phase: "parts",
          loadedBytes: 0,
          totalBytes: totalSize,
          chunkCurrent: 0,
          totalChunks,
        });
        const { data: session } = await axios.post(
          `${API_BASE}/admin/courseVideo/chunk-init`,
          {
            fileName: videoFile.name,
            totalSize,
            totalChunks,
            title: uploadForm.title,
            courseType: uploadForm.courseType,
            language: lang,
            videoLang: lang,
          },
          {
            headers: { ...authHeaders, "Content-Type": "application/json" },
            timeout: 60000,
            ...noGlobalLoader,
          }
        );
        const { uploadId } = session;
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE_BYTES;
          const end = Math.min(start + CHUNK_SIZE_BYTES, totalSize);
          const blob = videoFile.slice(start, end);
          const chunkFd = new FormData();
          chunkFd.append("chunk", blob, `part-${i}`);
          await axios.post(`${API_BASE}/admin/courseVideo/chunk/${uploadId}/${i}`, chunkFd, {
            ...longRequest,
            onUploadProgress: (ev) => {
              if (!ev.total) return;
              const loadedSoFar = Math.min(start + ev.loaded, totalSize);
              const pct = Math.round((loadedSoFar / totalSize) * 100);
              setUploadProgressPct(Math.min(97, pct));
              setUploadDetail({
                phase: "parts",
                loadedBytes: loadedSoFar,
                totalBytes: totalSize,
                chunkCurrent: i + 1,
                totalChunks,
              });
            },
          });
          setUploadProgressPct(Math.round(((i + 1) / totalChunks) * 97));
          setUploadDetail({
            phase: "parts",
            loadedBytes: end,
            totalBytes: totalSize,
            chunkCurrent: i + 1,
            totalChunks,
          });
        }
        setUploadDetail({
          phase: "merging",
          loadedBytes: totalSize,
          totalBytes: totalSize,
          chunkCurrent: totalChunks,
          totalChunks,
        });
        setUploadProgressPct(98);
        const { data: created } = await axios.post(
          `${API_BASE}/admin/courseVideo/chunk-complete`,
          { uploadId },
          { headers: { ...authHeaders, "Content-Type": "application/json" }, timeout: 0, ...noGlobalLoader }
        );
        if ((pdfFile || managingMaterialFile) && created?.video?._id) {
          if (pdfFile) {
            setUploadDetail({
              phase: "pdf",
              loadedBytes: 0,
              totalBytes: pdfFile.size,
              chunkCurrent: null,
              totalChunks: null,
            });
            setUploadProgressPct(99);
            const pdfFd = new FormData();
            pdfFd.append("title", uploadForm.title);
            pdfFd.append("courseType", uploadForm.courseType);
            pdfFd.append("language", lang);
            pdfFd.append("videoLang", lang);
            pdfFd.append("pdf", pdfFile);
            await axios.put(`${API_BASE}/admin/courseVideo/${created.video._id}?language=${langQ}`, pdfFd, {
              ...longRequest,
              onUploadProgress: (ev) => {
                if (!ev.total) return;
                setUploadProgressPct(98 + Math.round((ev.loaded / ev.total) * 1));
                setUploadDetail({
                  phase: "pdf",
                  loadedBytes: ev.loaded,
                  totalBytes: ev.total,
                  chunkCurrent: null,
                  totalChunks: null,
                });
              },
            });
          }
          if (managingMaterialFile) {
            setUploadDetail({
              phase: "material",
              loadedBytes: 0,
              totalBytes: managingMaterialFile.size,
              chunkCurrent: null,
              totalChunks: null,
            });
            setUploadProgressPct(99);
            const materialFd = new FormData();
            materialFd.append("title", uploadForm.title);
            materialFd.append("courseType", uploadForm.courseType);
            materialFd.append("language", lang);
            materialFd.append("videoLang", lang);
            materialFd.append("managingMaterial", managingMaterialFile);
            await axios.put(`${API_BASE}/admin/courseVideo/${created.video._id}?language=${langQ}`, materialFd, {
              ...longRequest,
              onUploadProgress: (ev) => {
                if (!ev.total) return;
                setUploadProgressPct(98 + Math.round((ev.loaded / ev.total) * 1));
                setUploadDetail({
                  phase: "material",
                  loadedBytes: ev.loaded,
                  totalBytes: ev.total,
                  chunkCurrent: null,
                  totalChunks: null,
                });
              },
            });
          }
        }
        setUploadProgressPct(100);
        toast.success("Video uploaded successfully");
      } else {
        await axios.post(`${API_BASE}/admin/courseVideo?language=${langQ}`, formData, {
          ...longRequest,
          onUploadProgress: (ev) => {
            if (!ev.total) return;
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgressPct(pct);
            setUploadDetail({
              phase: "upload",
              loadedBytes: ev.loaded,
              totalBytes: ev.total,
              chunkCurrent: null,
              totalChunks: null,
            });
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
      setUploadProgressPct(null);
      setUploadDetail(null);
    }
  };

  const resetForm = () => {
    setUploadForm({ title: "", courseType: "", language: "English" });
    setVideoFile(null);
    setPdfFile(null);
    setManagingMaterialFile(null);
    setEditId(null);
    setEditMode(false);
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!delId) return;
    try {
      await axios.delete(`${API_BASE}/admin/courseVideo/${delId}`, {
        headers: { Authorization: `Bearer ${token}` },
        ...noGlobalLoader,
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
      name: "Language",
      width: "110px",
      cell: (row) => (
        <Badge bg="secondary" className="text-capitalize">
          {row.language || "English"}
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
      name: "Documents",
      cell: (row) => {
        const courseFileUrl = row.fileUrl
          ? `${process.env.REACT_APP_BASE_uploads}/${row.fileUrl}`
          : "";
        const managingMaterialUrl = row.managingMaterialUrl
          ? `${process.env.REACT_APP_BASE_uploads}/${row.managingMaterialUrl}`
          : "";

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {row.fileUrl && (
              <a
                href={courseFileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                title="Open Course File"
                style={{ color: "#6f42c1", textDecoration: "none" }}
              >
                <FaFilePdf size={22} title="Course File" />
              </a>
            )}
            {row.managingMaterialUrl && (
              <a
                href={managingMaterialUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                title="Open Managing Material"
                style={{ color: "#17a2b8", textDecoration: "none" }}
              >
                <FaFilePdf size={22} title="Managing Material" />
              </a>
            )}
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
              setUploadForm({
                title: row.title,
                courseType: row.courseType,
                language: row.language || "English",
              });
              setVideoFile(null);
              setPdfFile(null);
              setManagingMaterialFile(null);
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
            {courseTypes.map((c) => (
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
      className="d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center justify-content-md-end"
    >
<Form.Select
className="w-100 course-video-toolbar-select"
style={{
  maxWidth: "100%",
  color: "var(--text-primary, #2d3a4b)",
}}
value={filterCourseType}
onChange={(e) => setFilterCourseType(e.target.value)}
>
<option value="">All Courses</option>
{courseTypes.map((c) => (
  <option key={c.value} value={c.value}>
    {c.label}
  </option>
))}
</Form.Select>

<Form.Select
  className="w-100 course-video-toolbar-select"
  style={{
    maxWidth: "100%",
    color: "var(--text-primary, #2d3a4b)",
  }}
  value={filterLanguage}
  onChange={(e) => setFilterLanguage(e.target.value)}
  title="Filter by video language"
>
  <option value="">All languages</option>
  {VIDEO_LANGUAGES.map((l) => (
    <option key={l.value} value={l.value}>
      {l.label}
    </option>
  ))}
</Form.Select>

<Button
  className="buttonColor course-video-toolbar-upload d-flex align-items-center justify-content-center flex-shrink-0 w-auto align-self-end align-self-md-center ms-auto ms-md-0 px-2 px-md-3"
  onClick={() => {
    resetForm();
    setShowModal(true);
  }}
>
  <IoMdAdd className="flex-shrink-0" />
  <span className="d-none d-sm-inline ms-1">Upload</span>
  <span className="d-sm-none ms-1">Upload</span>
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
      <Modal
        show={showModal}
        onHide={() => {
          if (!loading) setShowModal(false);
        }}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton={!loading}>
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
                {courseTypes.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Video language <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Text className="d-block mb-2" style={{ fontSize: "12px" }}>
                Students only see videos in the language assigned to them by admin (Student list → Edit).
              </Form.Text>
              <Form.Select
                value={uploadForm.language}
                onChange={(e) => setUploadForm((p) => ({ ...p, language: e.target.value }))}
                required
              >
                {VIDEO_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
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
              <Form.Text className="text-muted d-block" style={{ fontSize: 12 }}>
                Files above about 6MB are uploaded in smaller parts and merged on the server so large videos complete
                more reliably.
              </Form.Text>
            </Form.Group>

            {loading && (
              <div className="rounded border bg-light p-3 mb-1">
                <div className="fw-semibold small mb-2">
                  {uploadDetail?.phase === "merging"
                    ? "Merging video on server…"
                    : uploadDetail?.phase === "pdf"
                      ? "Uploading course file…"
                      : uploadDetail?.phase === "material"
                        ? "Uploading managing material…"
                        : uploadDetail?.phase === "preparing"
                          ? "Preparing upload…"
                          : editMode
                            ? "Updating…"
                            : "Uploading video…"}
                </div>
                <ProgressBar
                  animated
                  striped
                  now={uploadProgressPct ?? 0}
                  label={`${uploadProgressPct ?? 0}%`}
                  style={{ minHeight: "22px" }}
                />
                <div className="small text-muted mt-2 mb-0">
                  {uploadDetail?.phase === "merging" && (
                    <span>Almost done — combining all parts into one file.</span>
                  )}
                  {uploadDetail?.phase === "pdf" &&
                    uploadDetail.totalBytes > 0 &&
                    `${formatBytes(uploadDetail.loadedBytes)} / ${formatBytes(uploadDetail.totalBytes)} (Course File)`}
                  {uploadDetail?.phase === "material" &&
                    uploadDetail.totalBytes > 0 &&
                    `${formatBytes(uploadDetail.loadedBytes)} / ${formatBytes(uploadDetail.totalBytes)} (Managing Material)`}
                  {(uploadDetail?.phase === "upload" || uploadDetail?.phase === "parts") &&
                    uploadDetail.totalBytes > 0 && (
                      <span>
                        {formatBytes(uploadDetail.loadedBytes)} / {formatBytes(uploadDetail.totalBytes)}
                        {uploadDetail.totalChunks != null &&
                          uploadDetail.chunkCurrent != null &&
                          ` · Part ${uploadDetail.chunkCurrent} of ${uploadDetail.totalChunks}`}
                      </span>
                    )}
                  {uploadDetail?.phase === "preparing" && <span>Starting…</span>}
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Course File (PDF) {editMode ? "(Optional)" : "(Optional)"}
              </Form.Label>
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              <Form.Text className="text-muted d-block" style={{ fontSize: 12 }}>
                Admin may upload a PDF attachment. If left empty, students will not see a file link.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Managing Material File (PDF) {editMode ? "(Optional)" : "(Optional)"}
              </Form.Label>
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e) => setManagingMaterialFile(e.target.files?.[0] || null)}
              />
              <Form.Text className="text-muted d-block" style={{ fontSize: 12 }}>
                Admin may upload a managing material PDF attachment. If left empty, students will not see a managing material file link.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="buttonColor" disabled={loading}>
              {loading
                ? editMode
                  ? "Updating..."
                  : uploadProgressPct != null
                    ? `Uploading… ${uploadProgressPct}%`
                    : "Uploading..."
                : editMode
                  ? "Update"
                  : "Upload"}
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
        fullscreen="sm-down"
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
              className="w-100 course-video-modal-player"
              style={{ height: "auto" }}
            >
              <source src={selectedVideo} type="video/mp4" />
              <source src={selectedVideo} type="video/webm" />
              <source src={selectedVideo} type="video/quicktime" />
              <source src={selectedVideo} type="video/x-msvideo" />
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