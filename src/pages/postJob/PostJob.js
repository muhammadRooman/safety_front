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
} from "react-bootstrap";
import { FaImage, FaKeyboard, FaSave, FaPaperPlane } from "react-icons/fa";

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

  const [mode, setMode] = useState("manual");

  // Unified Form for both modes (Better approach)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    posterFile: null,
    companyName: "",
    contactNumber: "",
    location: "",
    jobType: "Full-Time",
    jobDescription: "",
    skills: "",
    deadline: "",
    applyLink: "",
  });

  // Load User
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await axios.get(`${API}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data?.user);
      } catch {
        toast.error("Could not load user details");
      }
    };
    if (token) loadUser();
  }, [token]);

  // Load Job for Editing
  useEffect(() => {
    if (!editJobId || !token) return;

    const loadJob = async () => {
      setFetchingJob(true);
      try {
        const res = await axios.get(`${API}/admin/job-post/${editJobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const job = res.data;

        const pm = job.postMode === "image" ? "image" : "manual";
        setMode(pm);
        setExistingPoster(job.posterImage || null);

        if (pm === "image") {
          setFormData({
            title: job.title || "",
            description: job.description || "",
            posterFile: null,
            contactNumber: job.contactNumber || "",
            companyName: "",
            location: "",
            jobType: "Full-Time",
            jobDescription: "",
            skills: "",
            deadline: "",
            applyLink: "",
          });
        } else {
          const dl = job.deadline ? String(job.deadline).slice(0, 10) : "";
          const sk = Array.isArray(job.skills) ? job.skills.join(", ") : "";

          setFormData({
            title: job.title || "",
            companyName: job.companyName || "",
            contactNumber: job.contactNumber || "",
            location: job.location || "",
            jobType: JOB_TYPES.some((j) => j.value === job.jobType) ? job.jobType : "Full-Time",
            jobDescription: job.jobDescriptionHtml || job.jobDescription || "",
            skills: sk,
            deadline: dl,
            applyLink: job.applyLink || "",
            description: job.description || "", // fallback
          });
        }
      } catch (err) {
        toast.error("Could not load job details");
        navigate("/dashboard/all-jobs");
      } finally {
        setFetchingJob(false);
      }
    };

    loadJob();
  }, [editJobId, token, navigate]);

  const buildFormData = (status) => {
    const fd = new FormData();
    fd.append("postMode", mode);
    fd.append("status", status);

    // Common Fields
    fd.append("title", formData.title.trim());
   

    if (mode === "image") {
      fd.append("description", formData.description.trim());
      if (formData.posterFile) fd.append("posterImage", formData.posterFile);
    } else {
      fd.append("companyName", formData.companyName.trim());
      fd.append("contactNumber", formData.contactNumber.trim());
      fd.append("location", formData.location.trim());
      fd.append("jobType", formData.jobType);
      fd.append("jobDescription", formData.jobDescription.trim());
      fd.append("skills", formData.skills.trim());
      if (formData.deadline) fd.append("deadline", formData.deadline);
      fd.append("applyLink", formData.applyLink.trim());
    }

    return fd;
  };

  const submit = async (status) => {
    if (user?.role !== "teacher") {
      toast.error("Only teachers/admins can post jobs");
      return;
    }

    // Validation
    if (mode === "image") {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error("Title and description are required");
        return;
      }
      if (!formData.posterFile && !existingPoster && !isEdit) {
        toast.error("Please upload a poster image");
        return;
      }
    } else {
      if (!formData.title.trim() || !formData.companyName.trim() || 
          !formData.location.trim() || !formData.jobDescription.trim()) {
        toast.error("Please fill all required fields (*)");
        return;
      }
    }

    setLoading(true);
    try {
      const fd = buildFormData(status);
      const url = isEdit 
        ? `${API}/admin/job-post/${editJobId}` 
        : `${API}/admin/job-post`;

      if (isEdit) {
        await axios.put(url, fd, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Job updated successfully");
      } else {
        await axios.post(url, fd, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(status === "published" ? "Job posted successfully" : "Draft saved");
      }

      navigate("/dashboard/all-jobs");
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle Input Change (Unified)
  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, posterFile: e.target.files?.[0] || null }));
  };

  if (user && user.role !== "teacher") {
    return (
      <Container className="py-5 text-center">
        <h4 className="text-muted">Only teachers/admins are allowed to post jobs.</h4>
      </Container>
    );
  }

  if (fetchingJob) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading job details...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/dashboard/all-jobs")}>All Jobs</Breadcrumb.Item>
        <Breadcrumb.Item active>{isEdit ? "Edit Job" : "Post a New Job"}</Breadcrumb.Item>
      </Breadcrumb>
<div></div>
      <h3 className="fw-bold mb-1 mb-0 fw-semibold name_heading">{isEdit ? "Edit Job" : "Post a New Job"}</h3>
      <p className="text-muted mb-4">
        {isEdit ? "Update the job details below" : "Choose your preferred posting method"}
      </p>

      {/* Post Type Selection */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">Posting Method</h5>
          {isEdit ? (
            <p className="text-muted mb-0">
              <strong>Current Mode:</strong> {mode === "image" ? "Image Advertisement" : "Manual Entry"} 
              (Cannot be changed)
            </p>
          ) : (
            <ButtonGroup className="flex-wrap">
              <Button
                variant={mode === "manual" ? "primary" : "outline-primary"}
                onClick={() => setMode("manual")}
              >
                <FaKeyboard className="me-2" /> Manual Entry
              </Button>
              <Button
                variant={mode === "image" ? "primary" : "outline-primary"}
                onClick={() => setMode("image")}
              >
                <FaImage className="me-2" /> Image Advertisement
              </Button>
            </ButtonGroup>
          )}
        </Card.Body>
      </Card>

      {/* ====================== IMAGE MODE ====================== */}
      {mode === "image" ? (
        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="mb-4">Image Advertisement Posting</h5>

            <Row className="g-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Job Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.title}
                    onChange={handleChange("title")}
                    placeholder="e.g. Urgent: Safety Officer Required"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleChange("contactNumber")}
                    placeholder="03xx-xxxxxxx"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Short Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange("description")}
                    placeholder="Brief summary that will appear below the poster..."
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Job Poster Image {!isEdit && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileChange}
                  />
                  {(formData.posterFile || (isEdit && existingPoster)) && (
                    <div className="mt-3 text-center">
                      <img
                        src={formData.posterFile 
                          ? URL.createObjectURL(formData.posterFile) 
                          : `${UP}/${existingPoster}`}
                        alt="Poster"
                        style={{ maxHeight: "280px", borderRadius: "8px" }}
                        className="shadow-sm"
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-3 justify-content-center flex-wrap mt-5">
              <Button variant="secondary" onClick={() => navigate("/dashboard/all-jobs")}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => submit("published")}
                disabled={loading}
              >
                <FaPaperPlane className="me-2" />
                {isEdit ? "Update & Publish" : "Post Job Now"}
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => submit("draft")}
                disabled={loading}
              >
                <FaSave className="me-2" />
                Save as Draft
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        /* ====================== MANUAL MODE ====================== */
        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="mb-4">Manual Job Posting</h5>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Job Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.title}
                    onChange={handleChange("title")}
                    placeholder="e.g. HSE Officer"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.companyName}
                    onChange={handleChange("companyName")}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.location}
                    onChange={handleChange("location")}
                    placeholder="Kohat, Pakistan"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Job Type <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.jobType}
                    onChange={handleChange("jobType")}
                  >
                    {JOB_TYPES.map((jt) => (
                      <option key={jt.value} value={jt.value}>{jt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Job Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    value={formData.jobDescription}
                    onChange={handleChange("jobDescription")}
                    placeholder="Detailed responsibilities, requirements, and qualifications..."
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Required Skills</Form.Label>
                  <Form.Control
                    value={formData.skills}
                    onChange={handleChange("skills")}
                    placeholder="Safety Management, Risk Assessment, First Aid"
                  />
                  <Form.Text className="text-muted">Comma separated</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleChange("contactNumber")}
                    placeholder="03xx-xxxxxxx"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Application Deadline</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange("deadline")}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Apply Link (Primary)</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.applyLink}
                    onChange={handleChange("applyLink")}
                    placeholder="https://example.com/apply"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-3 justify-content-center flex-wrap mt-5">
              <Button variant="secondary" onClick={() => navigate("/dashboard/all-jobs")}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => submit("published")}
                disabled={loading}
              >
                <FaPaperPlane className="me-2" />
                {isEdit ? "Update & Publish" : "Post Job Now"}
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={() => submit("draft")}
                disabled={loading}
              >
                <FaSave className="me-2" />
                Save as Draft
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}