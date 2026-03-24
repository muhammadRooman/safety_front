import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Spinner,
  Container,
  Breadcrumb,
  Badge,
} from "react-bootstrap";

const GoogleMeet = () => {
  const [linkData, setLinkData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const studentId = useSelector((state) => state.auth.id);
  const token = useSelector((state) => state.auth.token);

  const fetchLink = async (isSilent = false) => {
    if (!studentId || !token) return;
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/provide-link/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLinkData(response.data?.data || null);
    } catch (error) {
      // If no link exists (deleted by admin), show waiting state.
      if (error?.response?.status === 404) {
        setLinkData(null);
      } else {
        console.error("Error fetching link:", error);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };
  // ✅ Fetch Link initially + poll so admin delete reflects on student page
  useEffect(() => {
    if (!studentId || !token) return;
    fetchLink(false);
    const intervalId = setInterval(() => fetchLink(true), 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, token]);

  const formatDateTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
          Dashboard
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Google Meet</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <Card
          style={{
            width: "900px",
            borderRadius: "20px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
            padding: "50px",
            border: "none",
          }}
        >
          <Card.Body className="text-center">

            {/* 🔥 Header */}
            <h4 style={{ fontWeight: "bold" }}>
              <img src="/meet.png" alt="Provide Link" style={{ width: 38, height: 38 }} /> Live Google Meet Class
            </h4>

            {loading ? (
              <div style={{ marginTop: "20px" }}>
                <Spinner animation="border" />
                <p style={{ marginTop: "10px", color: "#666" }}>
                  Please wait, loading your class link...
                </p>
              </div>
            ) : linkData ? (
              <>
                {/* ✅ Status Badge */}
                <Badge bg="success" style={{ marginBottom: "10px" }}>
                  Active Session
                </Badge>

                <p style={{ color: "#555" }}>
                  Your meeting link is ready 🎉
                </p>

                <p style={{ fontSize: "12px", color: "#999" }}>
                  Provided on: {formatDateTime(linkData.createdAt)}
                </p>

                {/* ✅ Join Button */}
                <a
                  href={linkData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "15px",
                    padding: "12px 25px",
                    background: "linear-gradient(45deg, #28a745, #20c997)",
                    color: "#fff",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  🚀 Join Google Meet
                </a>
              </>
            ) : (
              <>
                {/* ❌ No Link UI */}
                <Badge bg="warning" text="dark" style={{ marginBottom: "10px" }}>
                  Waiting for Admin
                </Badge>

                <p style={{ color: "#555", fontWeight: "500" }}>
                  ⏳ Please wait, your Google Meet link will be provided shortly.
                </p>

                <p style={{ fontSize: "13px", color: "#999" }}>
                  Stay on this page. The link will appear automatically once available.
                </p>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default GoogleMeet;