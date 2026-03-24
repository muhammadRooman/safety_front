import React, { useEffect, useState } from "react";
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
} from "react-bootstrap";

export default function MyVideos() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [videos, setVideos] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, userRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/admin/courseVideo/my-videos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setVideos(videosRes.data);
        const subs = userRes.data?.user?.subject;
        setAssignedCourses(Array.isArray(subs) ? subs : subs ? [subs] : []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load videos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const byCourse = videos.reduce((acc, v) => {
    const c = v.courseType || "Other";
    if (!acc[c]) acc[c] = [];
    acc[c].push(v);
    return acc;
  }, {});

  const courseOrder = ["NEBOSH", "IOSH", "OSHA","RIGGER3"];
  const displayVideos = activeTab === "all" ? videos : (byCourse[activeTab] || []);

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>My Course Videos</Breadcrumb.Item>
      </Breadcrumb>



      <Row className="mb-4">
        <Col>
          <h3 className="mb-0 fw-semibold name_heading">My Course Videos</h3>
          <p
          className="mb-1"
          style={{
            color: "red",
            // fontWeight: "bold",
            // animation: "blinker 4s linear infinite"
          }}
        >
    
        
            Only videos for your assigned course(s) are shown. You cannot see other courses.
          </p>
         
          {assignedCourses.length > 0 && (
            <p className="mb-0">
              <strong>Your assigned course(s):</strong>{" "}
              <span
                style={{
                  color: "green",
                  fontWeight: "bold",
                  animation: "blinker 2s linear infinite"
                }}
              >
                {assignedCourses.join(", ")}
              </span>
            </p>
          )}
          
          
        </Col>
      </Row>

      {loading ? (
        <p>Loading...</p>
      ) : videos.length === 0 ? (
        <Card>
        <Card.Body className="text-center" style={{ color: "#dc3545" }}>
        <p style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.5rem" }}>
          No course videos assigned yet.
        </p>
        <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
          Please complete your payment to access the courses. If you have already paid and the courses are still not visible, kindly contact the admin for assistance.
        </p>
        <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
          Contact Admin: <strong>03330222006</strong> | Email: <strong>muhammadrooman5@gmail.com</strong>
        </p>
      </Card.Body>
          
        </Card>
      ) : (
        <>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "all")} className="mb-3">
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
                      style={{ width: "100%", maxHeight: 200 }}
                      src={`${process.env.REACT_APP_BASE_uploads}/${v.videoUrl}`}
                    >
                      Your browser does not support the video tag.
                    </video>
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
