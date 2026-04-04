import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { 
  Container, Row, Col, Card, Breadcrumb, Badge, Button, 
  Modal 
} from "react-bootstrap";

import { 
  FaMapMarkerAlt, FaPhone, FaBuilding, FaTools, 
  FaBriefcase, FaExternalLinkAlt, FaCalendarAlt 
} from "react-icons/fa";
import { FcAdvertising } from "react-icons/fc";

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

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

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

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const imageUrl = selectedJob?.posterImage 
    ? `${UP}/${selectedJob.posterImage}` 
    : null;

  return (
    <Container fluid className="admin-messages-page py-3 px-3 px-md-4">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Job Opportunities</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <h3 className="fw-bold mb-1 mb-0 fw-semibold name_heading">Job Opportunities</h3>
          <FcAdvertising size={36} />
        </div>
        <p className="text-muted mb-0 fs-5">{jobs.length} Open Positions</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Loading job postings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="text-center py-5 border-0 shadow-sm">
          <Card.Body>
            <h5 className="text-muted">No open positions available right now</h5>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {jobs.map((job) => {
            const shortDesc = job?.postMode === "image"
              ? job?.description || "Image-based job posting"
              : stripHtml(job.jobDescriptionHtml || job.description);

            const skills = Array.isArray(job.skills) ? job.skills : [];
            const jobImage = job.posterImage ? `${UP}/${job.posterImage}` : null;

            return (
              <Col key={job._id} lg={6} xl={4}>
                <Card 
                  className="h-100 shadow-sm border-0 overflow-hidden hover-card" 
                  style={{ borderRadius: "16px" }}
                >
                  <Card.Body className="p-4 d-flex flex-column">

                    {/* Job Title */}
                    <h5 className="fw-bold mb-3" style={{ lineHeight: "1.3" }}>
                      {job.title}
                    </h5>

                    {/* Company */}
                    {job.companyName && (
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <FaBuilding size={20} className="text-primary" />
                        <span className="fw-semibold text-dark">{job.companyName}</span>
                      </div>
                    )}

                    {/* Meta Info */}
                   <div className="row g-3 mb-4 text-muted small border-bottom pb-3">
  {job.location && (
    <div className="col-6 d-flex align-items-center gap-2">
      <FaMapMarkerAlt size={18} className="text-danger" />
      <span>{job.location}</span>
    </div>
  )}

  {job.jobType && (
    <div className="col-6 d-flex align-items-center gap-2">
      <FaBriefcase size={18} className="text-success" />
      <span className="text-capitalize">{job.jobType}</span>
    </div>
  )}

  {job.contactNumber && (
    <div className="col-12 d-flex align-items-center gap-2 mt-3">
      <FaPhone size={18} className="text-info" />
      <span><strong>Contact:</strong> {job.contactNumber}</span>
    </div>
  )}
</div>

                    {/* Image */}
                    {job.postMode === "image" && jobImage && (
                      <div className="mb-4 rounded-3 overflow-hidden shadow-sm" 
                           style={{ height: "185px" }}>
                        <img
                          src={jobImage}
                          alt={job.title}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}

                    {/* Job Description Label + Short Text */}
                    <div className="mb-3 border-bottom pb-3">
  <div className="small fw-semibold text-muted mb-2 d-flex align-items-center gap-2">
    📋 Job Description
  </div>

  <div
    className="text-secondary"
    style={{
      maxHeight: "110px",
      overflowY: "auto",
      lineHeight: "1.65",
      fontSize: "0.97rem",
    }}
  >
    {shortDesc || "No description available."}
  </div>
</div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="mb-4">
                      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <FaTools /> Required Skills
                    </h5>
                        <div className="d-flex flex-wrap gap-2">
                          {skills.slice(0, 4).map((skill, i) => (
                            <Badge 
                              key={i} 
                              className="rounded-pill px-3 py-1 bg-light text-dark border"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {skills.length > 4 && (
                            <Badge className="rounded-pill px-3 py-1 bg-light text-dark border">
                              +{skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deadline */}
                    {job.deadline && (
                      <div className="d-flex align-items-center gap-4 mb-4 small">
                        {/* Last Date */}
                        <div className="d-flex align-items-center gap-2 text-danger">
                          <FaCalendarAlt size={18} />
                          <span>
                            Last Date:{" "}
                            <strong>
                              {new Date(job.deadline).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </strong>
                          </span>
                        </div>
                    
                        {/* Status */}
                        <div
                          className="fw-bold"
                          style={{
                            color:
                              new Date(job.deadline) < new Date()
                                ? "red"
                                : "green",
                          }}
                        >
                          {new Date(job.deadline) < new Date()
                            ? "Expired"
                            : `${Math.ceil(
                                (new Date(job.deadline) - new Date()) /
                                  (1000 * 60 * 60 * 24)
                              )} day(s) left`}
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="d-flex gap-2 mt-auto pt-2">
                      <Button
                        variant="outline-primary"
                        className="flex-grow-1 py-2"
                        onClick={() => handleViewDetails(job)}
                      >
                        View Full Details
                      </Button>

                      {job.applyLink && (
                        <Button
                          variant="success"
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-flex align-items-center gap-2 px-4"
                        >
                          Apply <FaExternalLinkAlt size={14} />
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

      {/* ====================== DETAILS MODAL ====================== */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title className="fw-bold fs-4">
            {selectedJob?.title}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4 pt-2">
          {selectedJob && (
            <>
              {selectedJob.postMode === "image" && imageUrl && (
                <div className="mb-5 rounded-4 overflow-hidden shadow">
                  <img
                    src={imageUrl}
                    alt="Job Poster"
                    className="w-100"
                    style={{ maxHeight: "420px", objectFit: "cover" }}
                  />
                </div>
              )}

              <Row className="g-3 mb-5">
                {selectedJob.companyName && (
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-white border rounded-3 shadow-sm h-100">
                      <FaBuilding size={26} className="text-primary" />
                      <div>
                        <small className="text-muted">Company</small>
                        <div className="fw-semibold">{selectedJob.companyName}</div>
                      </div>
                    </div>
                  </Col>
                )}

                {selectedJob.location && (
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-white border rounded-3 shadow-sm h-100">
                      <FaMapMarkerAlt size={26} className="text-danger" />
                      <div>
                        <small className="text-muted">Location</small>
                        <div className="fw-semibold">{selectedJob.location}</div>
                      </div>
                    </div>
                  </Col>
                )}

                {selectedJob.jobType && (
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-white border rounded-3 shadow-sm h-100">
                      <FaBriefcase size={26} className="text-success" />
                      <div>
                        <small className="text-muted">Job Type</small>
                        <div className="fw-semibold text-capitalize">{selectedJob.jobType}</div>
                      </div>
                    </div>
                  </Col>
                )}

                {selectedJob.contactNumber && (
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-white border rounded-3 shadow-sm h-100">
                      <FaPhone size={26} className="text-info" />
                      <div>
                        <small className="text-muted">Contact Number</small>
                        <div className="fw-semibold">{selectedJob.contactNumber}</div>
                      </div>
                    </div>
                  </Col>
                )}

                {selectedJob.deadline && (
                  <Col xs={12}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3">
                      <FaCalendarAlt size={26} className="text-danger" />
                      <div className="flex-grow-1">
                        <small className="text-danger fw-medium">Application Deadline</small>
                        <div className="fw-bold fs-5">
                          {new Date(selectedJob.deadline).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </div>
                      </div>
                      <Badge bg="danger" className="px-3 py-2">Urgent</Badge>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Description */}
              <div className="mb-5">
                <h5 className="fw-bold mb-3">📋 Job Description</h5>
                <div
                  className="p-4 bg-light rounded-3 border shadow-sm"
                  style={{
                    maxHeight: "460px",
                    overflowY: "auto",
                    lineHeight: "1.8",
                    fontSize: "1.02rem"
                  }}
                  dangerouslySetInnerHTML={{
                    __html: selectedJob.jobDescriptionHtml ||
                            selectedJob.description ||
                            "<p class='text-muted'>No description available.</p>",
                  }}
                />
              </div>

              {/* Skills */}
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <FaTools /> Required Skills
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, i) => (
                      <Badge
                        key={i}
                        className="rounded-pill px-4 py-2 fs-6 fw-medium"
                        bg="primary"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-2">
          <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>

          {selectedJob?.applyLink && (
            <Button
              variant="success"
              href={selectedJob.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="d-flex align-items-center gap-2 px-5"
            >
              Apply Now <FaExternalLinkAlt />
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}