import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Breadcrumb, Badge, Button } from "react-bootstrap";
import { FaMapMarkerAlt, FaBriefcase, FaExternalLinkAlt } from "react-icons/fa";

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

  return (
    <Container className="py-4 jobs-board-page">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Browse Jobs</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="name_heading mb-4">Browse Jobs</h3>

      {loading ? (
        <p>Loading…</p>
      ) : jobs.length === 0 ? (
        <Card className="text-center text-muted py-5">No open positions right now.</Card>
      ) : (
        <Row className="g-4">
          {jobs.map((job) => {
            const snippet =
  job?.postMode === "image"
    ? job?.description
    : stripHtml(job.jobDescriptionHtml);
            const skills = Array.isArray(job.skills) ? job.skills : [];

            return (
              <Col key={job._id} md={6} lg={4}>
                <Card className="h-100 shadow-sm border-0 job-card">
                 
                 <Card.Body >
                 <div
                 className="d-flex justify-content-around align-items-center mb-2"
                 style={{
                   borderBottom: "2px solid #dee2e6",
                   paddingBottom: "6px",
                   backgroundColor: "#f4f6f8",
                 }}
               >
                 <span>Job Title</span>
                 <Card.Title className="h6 fw-bold mb-0">
                   {job.title}
                 </Card.Title>
               </div>
               {job.postMode === "image" && job.posterImage && (
                <div
                  className="job-card-img-wrap"
                  style={{
                    height: 160,
                    background: "#f4f6f8",
                    overflow: "hidden",
                    borderRadius: "0.375rem 0.375rem 0 0",
                  }}
                >
                  <img
                    src={`${UP}/${job.posterImage}`}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}
                    {job.postMode === "manual" && job.companyName && (
                      <div className="small text-muted mb-2 fw-semibold">{job.companyName}</div>
                    )}
                    <div className="small text-muted mb-2 d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                      {job.location && (
                        <span>
                          <FaMapMarkerAlt className="me-1 " />
                          <strong> {job.location}</strong>
                          
                        </span>
                      )}
                      {job.jobType && (
                        <span>
                          <FaBriefcase className="me-1" />
                          <strong>{job.jobType}</strong>
                        </span>
                      )}
                    </div>
                  <Card.Text
  className="small text-secondary"
  style={{
    height: 80,
    overflowY: "auto",
  }}
>
  {snippet}
</Card.Text>
                   
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
                    {job.applyLink && (
                      <Button
                        size="sm"
                        className="buttonColor"
                        href={job.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apply Now <FaExternalLinkAlt className="ms-1" />
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}
