import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Breadcrumb,
  ButtonGroup,
  InputGroup,
} from "react-bootstrap";
import { FaImage, FaKeyboard } from "react-icons/fa";

const API = process.env.REACT_APP_BASE_ADMIN_API;
const UP = process.env.REACT_APP_BASE_uploads;

const JOB_TYPES = [
  { value: "Full-Time", label: "Full-Time" },
  { value: "Part-Time", label: "Part-Time" },
  { value: "Internship", label: "Internship" },
  { value: "Contract", label: "Contract" },
];

export default function PostJob() {
  const navigate = useNavigate();
  const { id: editJobId } = useParams();
  const isEdit = Boolean(editJobId);
  const token = useSelector((state) => state.auth.token);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(!!editJobId);
  const [existingPoster, setExistingPoster] = useState(null);

  /** @type {'image' | 'manual'} */
  const [mode, setMode] = useState("manual");

  const [imageForm, setImageForm] = useState({
    title: "",
    description: "",
    posterFile: null,
  });

  const [manualForm, setManualForm] = useState({
    title: "",
    companyName: "",
    location: "",
    jobType: "Full-Time",
    jobDescription: "",
    skills: "",
    deadline: "",
    applyLink: "",
    applyLinkSecondary: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data?.user);
      } catch {
        toast.error("Could not load user");
      }
    };
    if (token) load();
  }, [token]);

  useEffect(() => {
    if (!editJobId) {
      setFetchingJob(false);
      return;
    }
    if (!token) return;
    let cancelled = false;
    const loadJob = async () => {
      setFetchingJob(true);
      try {
        const res = await axios.get(`${API}/admin/job-post/${editJobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const job = res.data;
        if (cancelled || !job) return;
        const pm = job.postMode === "image" ? "image" : "manual";
        setMode(pm);
        setExistingPoster(job.posterImage || null);
        if (pm === "image") {
          setImageForm({
            title: job.title || "",
            description: job.description || "",
            posterFile: null,
          });
        } else {
          const dl = job.deadline
            ? String(job.deadline).slice(0, 10)
            : "";
          const sk = Array.isArray(job.skills) ? job.skills.join(", ") : "";
          setManualForm({
            title: job.title || "",
            companyName: job.companyName || "",
            location: job.location || "",
            jobType: JOB_TYPES.some((j) => j.value === job.jobType) ? job.jobType : "Full-Time",
            jobDescription: job.jobDescriptionHtml || "",
            skills: sk,
            deadline: dl,
            applyLink: job.applyLink || "",
            applyLinkSecondary: job.applyLinkSecondary || "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || "Could not load job");
          navigate("/dashboard/all-jobs");
        }
      } finally {
        if (!cancelled) setFetchingJob(false);
      }
    };
    loadJob();
    return () => {
      cancelled = true;
    };
  }, [editJobId, token, navigate]);

  const buildFormData = (status) => {
    const fd = new FormData();
    fd.append("postMode", mode);
    fd.append("status", status);

    if (mode === "image") {
      fd.append("title", imageForm.title.trim());
      fd.append("description", imageForm.description.trim());
      if (imageForm.posterFile) fd.append("posterImage", imageForm.posterFile);
    } else {
      fd.append("title", manualForm.title.trim());
      fd.append("companyName", manualForm.companyName.trim());
      fd.append("location", manualForm.location.trim());
      fd.append("jobType", manualForm.jobType);
      fd.append("jobDescription", manualForm.jobDescription.trim());
      fd.append("skills", manualForm.skills.trim());
      if (manualForm.deadline) fd.append("deadline", manualForm.deadline);
      fd.append("applyLink", manualForm.applyLink.trim());
      fd.append("applyLinkSecondary", manualForm.applyLinkSecondary.trim());
    }
    return fd;
  };

  const submit = async (status) => {
    if (user?.role !== "teacher") {
      toast.error("Only admin can post jobs");
      return;
    }

    if (mode === "image") {
      if (!imageForm.title.trim() || !imageForm.description.trim()) {
        toast.error("Title and description are required");
        return;
      }
      if (!imageForm.posterFile && !existingPoster) {
        toast.error("Please select a job poster image");
        return;
      }
    } else {
      if (
        !manualForm.title.trim() ||
        !manualForm.companyName.trim() ||
        !manualForm.location.trim() ||
        !manualForm.jobDescription.trim()
      ) {
        toast.error("Please fill title, company, location, and job description");
        return;
      }
    }

    setLoading(true);
    try {
      const fd = buildFormData(status);
      if (isEdit) {
        await axios.put(`${API}/admin/job-post/${editJobId}`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(status === "draft" ? "Draft saved" : "Job updated");
      } else {
        await axios.post(`${API}/admin/job-post`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(status === "draft" ? "Saved as draft" : "Job posted");
      }
      if (!isEdit) {
        if (mode === "image") {
          setImageForm({ title: "", description: "", posterFile: null });
        } else {
          setManualForm({
            title: "",
            companyName: "",
            location: "",
            jobType: "Full-Time",
            jobDescription: "",
            skills: "",
            deadline: "",
            applyLink: "",
            applyLinkSecondary: "",
          });
        }
      }
      navigate("/dashboard/all-jobs");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          (isEdit ? "Failed to update job" : "Failed to post job")
      );
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role !== "teacher") {
    return (
      <Container className="py-5">
        <p className="text-center text-muted">Only admin can post jobs.</p>
      </Container>
    );
  }

  if (fetchingJob) {
    return (
      <Container className="py-5">
        <p className="text-center text-muted">Loading job…</p>
      </Container>
    );
  }

  return (
    <Container className="py-4 post-job-page">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/dashboard/all-jobs")}>All Jobs</Breadcrumb.Item>
        <Breadcrumb.Item active>{isEdit ? "Edit job" : "Post a Job"}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mb-4 align-items-center">
        <Col>
          <h3 className="mb-0 fw-semibold name_heading">{isEdit ? "Edit job" : "Post a New Job"}</h3>
          <p className="text-muted small mb-0">
            {isEdit
              ? "Update details and save. Post type stays the same for this job."
              : "Choose how you want to publish: upload a single advertisement image, or fill the full manual form."}
          </p>
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <p className="fw-semibold mb-2">Post type</p>
          {isEdit ? (
            <p className="mb-0 text-muted small">
              {mode === "image" ? "Image advertisement" : "Manual entry"} (fixed for this listing)
            </p>
          ) : (
            <ButtonGroup className="flex-wrap">
              <Button
                variant={mode === "manual" ? "primary" : "outline-primary"}
                className={mode === "manual" ? "buttonColor" : ""}
                onClick={() => setMode("manual")}
              >
                <FaKeyboard className="me-2" />
                Manual entry
              </Button>
              <Button
                variant={mode === "image" ? "primary" : "outline-primary"}
                className={mode === "image" ? "buttonColor" : ""}
                onClick={() => setMode("image")}
              >
                <FaImage className="me-2" />
                Image advertisement
              </Button>
            </ButtonGroup>
          )}
        </Card.Body>
      </Card>

      {mode === "image" ? (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <h5 className="mb-3">Image job post</h5>
            <p className="text-muted small">
              Add a title, short description, and upload your job ad image (JPEG / PNG / GIF).
            </p>
            <Form.Group className="mb-3">
              <Form.Label>
                Job title <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                value={imageForm.title}
                onChange={(e) => setImageForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Safety Officer — Apply now"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Description <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={imageForm.description}
                onChange={(e) => setImageForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short summary shown with the image"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Poster image {!isEdit && <span className="text-danger">*</span>}
                {isEdit && <span className="text-muted fw-normal ms-1">(optional — keep current if unchanged)</span>}
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={(e) =>
                  setImageForm((p) => ({ ...p, posterFile: e.target.files?.[0] || null }))
                }
              />
              {imageForm.posterFile ? (
                <div className="mt-2 d-flex justify-content-center">
                  <img
                    src={URL.createObjectURL(imageForm.posterFile)}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 8 }}
                  />
                </div>
              ) : (
                isEdit &&
                existingPoster &&
                UP && (
                  <div className="mt-2 d-flex justify-content-center">
                    <img
                      src={`${UP.replace(/\/$/, "")}/${existingPoster}`}
                      alt="Current poster"
                      style={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 8 }}
                    />
                  </div>
                )
              )}
            </Form.Group>
            <div className="d-flex gap-2 flex-wrap justify-content-center">
            <Button variant="btn btn-secondary" disabled={loading} onClick={() => navigate("/dashboard/all-jobs")}>Cancel</Button>
              <Button className="buttonColor" disabled={loading} onClick={() => submit("published")}>
                {isEdit ? "Update & publish" : "Post Job"}
              </Button>
              <Button variant="btn btn-primary" disabled={loading} onClick={() => submit("draft")}>
                {isEdit ? "Save as draft" : "Save as draft"}
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <h5 className="mb-3">Manual job post</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Job title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    value={manualForm.title}
                    onChange={(e) => setManualForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Software Engineering Intern"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Company name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    value={manualForm.companyName}
                    onChange={(e) => setManualForm((p) => ({ ...p, companyName: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Location <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    value={manualForm.location}
                    onChange={(e) => setManualForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="City / Remote"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Job type <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={manualForm.jobType}
                    onChange={(e) => setManualForm((p) => ({ ...p, jobType: e.target.value }))}
                  >
                    {JOB_TYPES.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Job description <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={manualForm.jobDescription}
                onChange={(e) => setManualForm((p) => ({ ...p, jobDescription: e.target.value }))}
                placeholder="Full role details, responsibilities, requirements..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Required skills</Form.Label>
              <Form.Control
                value={manualForm.skills}
                onChange={(e) => setManualForm((p) => ({ ...p, skills: e.target.value }))}
                placeholder="Comma separated e.g. Design, Marketing, API"
              />
              <Form.Text className="text-muted">Separate skills with commas.</Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Application deadline</Form.Label>
                  <Form.Control
                    type="date"
                    value={manualForm.deadline}
                    onChange={(e) => setManualForm((p) => ({ ...p, deadline: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Apply link (primary)</Form.Label>
              <InputGroup>
                <Form.Control
                  type="url"
                  value={manualForm.applyLink}
                  onChange={(e) => setManualForm((p) => ({ ...p, applyLink: e.target.value }))}
                  placeholder="https://"
                />
              </InputGroup>
            </Form.Group>
           

            <div className="d-flex gap-2 flex-wrap justify-content-center">
            <Button variant="btn btn-secondary" disabled={loading} onClick={() => navigate("/dashboard/all-jobs")}>Cancel</Button>

              <Button className="buttonColor" disabled={loading} onClick={() => submit("published")}>
                {isEdit ? "Update & publish" : "Post Job"}
              </Button>
              <Button variant="btn btn-primary" disabled={loading} onClick={() => submit("draft")}>
                Save as draft
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
