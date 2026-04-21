import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  Container,
  Card,
  Row,
  Col,
  Breadcrumb,
  Badge,
  Tabs,
  Tab,
  Button,
} from "react-bootstrap";
import { FaDownload } from "react-icons/fa";

export default function MyVideos() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [videos, setVideos] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [assignedVideoLanguage, setAssignedVideoLanguage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [contact, setContact] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  // Fetch OHS Courses Config (Admin Contact)
  useEffect(() => {
    const fetchConfig = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE}/admin/ohs-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("OHS Courses config response:", res.data);
        setContact(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load admin contact");
      }
    };

    fetchConfig();
  }, [token, API_BASE]);

  // Main Fetch Data Function
  const fetchData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [videosRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/courseVideo/my-videos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setVideos(videosRes.data || []);
      const subs = userRes.data?.user?.subject;
      setAssignedCourses(Array.isArray(subs) ? subs : subs ? [subs] : []);
      setAssignedVideoLanguage(userRes.data?.user?.videoLanguage || "English");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Silent Refresh Function
  const silentRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      toast.success("Videos refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh videos");
    } finally {
      setRefreshing(false);
    }
  };

  // Group videos by course
  const byCourse = videos.reduce((acc, v) => {
    const c = v.courseType || "Other";
    if (!acc[c]) acc[c] = [];
    acc[c].push(v);
    return acc;
  }, {});

  const courseOrder = ["NEBOSH", "IOSH", "OSHA", "RIGGER3"];
  const displayVideos = activeTab === "all" ? videos : (byCourse[activeTab] || []);

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>My Manage Videos</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-semibold name_heading">Live Class</h3>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={silentRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Checking..." : "Refresh"}
        </Button>
      </div>

      <Row className="mb-4">
        <Col>
          <h3 className="mb-0 fw-semibold name_heading">My Manage Videos</h3>
          <p className="mb-1" style={{ color: "red" }}>
            Only videos for your assigned course(s) are shown. You cannot see other courses.
          </p>

          {assignedCourses.length > 0 && (
            <p className="mb-0">
              <strong>Your assigned course(s):</strong>{" "}
              <span style={{ color: "green", fontWeight: "bold" }}>
                {assignedCourses.join(", ")}
              </span>
            </p>
          )}

          <p className="mb-0 mt-2 text-muted" style={{ fontSize: "0.95rem" }}>
            <strong>Video language (set by admin):</strong>{" "}
            <span style={{ color: "green", fontWeight: "bold" }}>
              {assignedVideoLanguage || "English"}
            </span>
            {" — "} You only see Manage Videos recorded in this language. To change it, contact the admin.
          </p>
        </Col>
      </Row>

      {loading ? (
        <Card>
          <Card.Body className="text-center">
            <p>Loading videos...</p>
          </Card.Body>
        </Card>
      ) : videos.length === 0 ? (
        <Card>
          <Card.Body className="text-center" style={{ color: "#dc3545" }}>
            <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.5rem" }}>
              No Manage Videos to show yet.
            </p>
            <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              If you have assigned courses but no videos appear, the admin may not have uploaded videos in your language ({assignedVideoLanguage || "English"}) yet.
            </p>
            <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              Please complete your payment to access the courses. If you have already paid and still cannot see videos, contact admin.
            </p>
            {contact && (
              <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                CEO: <strong>{contact.name}</strong> | Contact: <strong>{contact.phone}</strong> | Email: <strong>{contact.email}</strong>
              </p>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || "all")}
            className="mb-3"
          >
            <Tab eventKey="all" title={`All (${videos.length})`} />
            {courseOrder.map((c) =>
              byCourse[c]?.length ? (
                <Tab key={c} eventKey={c} title={`${c} (${byCourse[c].length})`} />
              ) : null
            )}
          </Tabs>

          <Row>
            {displayVideos.map((v) => (
              <Col key={v._id} md={6} lg={4} className="mb-3">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h6 mb-0">{v.title}</Card.Title>
                      <Badge bg="primary">{v.courseType}</Badge>
                    </div>

                    <video
                      controls
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      style={{ width: "100%", maxHeight: 200 }}
                    >
                      <source src={`${process.env.REACT_APP_BASE_uploads}/${v.videoUrl}`} type="video/mp4" />
                      <source src={`${process.env.REACT_APP_BASE_uploads}/${v.videoUrl}`} type="video/webm" />
                      <source src={`${process.env.REACT_APP_BASE_uploads}/${v.videoUrl}`} type="video/quicktime" />
                      <source src={`${process.env.REACT_APP_BASE_uploads}/${v.videoUrl}`} type="video/x-msvideo" />
                      Your browser does not support the video tag.
                    </video>

                    {v.fileUrl && (
                      <div className="mt-2">
                        <a
                          href={`${process.env.REACT_APP_BASE_uploads}/${v.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#6f42c1",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <FaDownload />
                          Open course file
                        </a>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </Container>
  );
}