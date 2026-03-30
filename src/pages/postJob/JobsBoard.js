import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Container, Row, Col, Card, Breadcrumb, Badge, Button, 
  Modal 
} from "react-bootstrap";
import { FaMapMarkerAlt, FaBriefcase, FaExternalLinkAlt, FaEye } from "react-icons/fa";

const API = process.env.REACT_APP_BASE_ADMIN_API;
const UP = process.env.REACT_APP_BASE_uploads;

function stripHtml(html) {
  if (!html) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

export default function JobsBoard() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/job-post`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Open image modal
  const handleViewImage = (imageUrl, title) => {
    setSelectedImage(imageUrl);
    setSelectedTitle(title);
    setShowImageModal(true);
  };

  return (
    <Container className="py-4 jobs-board-page">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Browse Jobs</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="mb-4 fw-semibold name_heading">Browse Jobs</h3>

      {loading ? (
        <p>Loading…</p>
      ) : jobs.length === 0 ? (
        <Card className="text-center text-muted py-5">No open positions right now.</Card>
      ) : (
        <Row className="g-4">
          {jobs.map((job) => {
            const snippet =
              job?.postMode === "image"
                ? job?.description || "Image-based job posting"
                : stripHtml(job.jobDescriptionHtml);

            const skills = Array.isArray(job.skills) ? job.skills : [];
            const imageUrl = job.posterImage ? `${UP}/${job.posterImage}` : null;

            return (
              <Col key={job._id} md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 job-card">
                  <Card.Body>
                    {/* Job Title Header */}
                    <div
                      className="d-flex  align-items-center mb-2"
                      style={{
                        padding: "8px 20px 8px 20px",
                        borderRadius: "20px",
                        borderBottom: "2px solid #dee2e6",
                        paddingBottom: "6px",
                        backgroundColor: "#f4f6f8",
                        justifyContent:"space-between"
                      }}
                    >
                    <div className="d-flex align-items-center gap-5">
                    <span className="h6 fw-bold mb-0">Job Title</span>
                  
                    <span className="arrow">→</span>
                  
                    <Card.Title className="h6 fw-bold mb-0">
                      {job.title}
                    </Card.Title>
                  </div>
                    </div>

                    {/* Image Poster */}
                    {job.postMode === "image" && imageUrl && (
                      <div
                        className="job-card-img-wrap mb-3"
                        style={{
                          height: 160,
                          background: "#f4f6f8",
                          overflow: "hidden",
                          borderRadius: "0.375rem",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={job.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}

                    {/* Company Name */}
                    {job.postMode === "manual" && job.companyName && (
                      <div className="small text-muted mb-2 fw-semibold">{job.companyName}</div>
                    )}

                    {/* Location & Job Type */}
                    <div className="small text-muted mb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                      {job.location && (
                        <span>
                          <FaMapMarkerAlt className="me-1" />
                          <strong>{job.location}</strong>
                        </span>
                      )}
                      {job.jobType && (
                        <span>
                          <FaBriefcase className="me-1" />
                          <strong>{job.jobType}</strong>
                        </span>
                      )}
                    </div>

                    {/* Description Snippet */}
                    <Card.Text
                      className="small text-secondary mb-3"
                      style={{
                        height: 80,
                        overflowY: "auto",
                      }}
                    >
                      {snippet}
                    </Card.Text>

                    {/* Required Skills */}
                    {skills.length > 0 && (
                      <div className="mb-3">
                        <div className="fw-bold mb-1">Required skills:</div>
                        <div className="d-flex flex-wrap gap-1">
                          {skills.slice(0, 5).map((s) => (
                            <Badge
                              key={s}
                              bg="light"
                              text="dark"
                              className="fw-normal border"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Apply Button + View Image Button */}
                    <div className="d-flex gap-2">
                      {job.applyLink && (
                        <Button
                          size="sm"
                          className="buttonColor flex-grow-1"
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Apply Now <FaExternalLinkAlt className="ms-1" />
                        </Button>
                      )}

                      {/* View Poster Button - Only for image posts */}
                      {job.postMode === "image" && imageUrl && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewImage(imageUrl, job.title)}
                        >
                          <FaEye className="me-1" /> View Poster
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Image Modal */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Job Poster"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "85vh",
                objectFit: "contain",
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Close
          </Button>
          {selectedImage && (
            <Button
              variant="primary"
              href={selectedImage}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Full Image
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}