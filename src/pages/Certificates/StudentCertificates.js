import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import { FaDownload } from "react-icons/fa";
import { useSelector } from "react-redux";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Badge,
} from "react-bootstrap";
import { FaFilePdf, FaCertificate,FaAward } from "react-icons/fa";

export default function StudentCertificates() {
  const token = useSelector((state) => state.auth.token);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;
  const UPLOADS_BASE = process.env.REACT_APP_BASE_uploads || "";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/certificates/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load certificates");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ background: "#f4f7fb", minHeight: "100vh" }}>
      <Container fluid className="p-4">

        {/* HEADER */}
        <div
          className="mb-4 p-4 rounded-4 text-white"
          style={{
             background: "linear-gradient(135deg, rgb(49, 67, 77), rgb(255, 232, 157))",
          }}
        >
          <h3 className="fw-bold"> <FaAward size={30} color="#ffcc2a" /> My Certificates</h3>
          <p className="mb-0">  Based on your excellent performance, you will be awarded achievement certificates here.</p>
        </div>

        {/* STATS */}
        <Row className="mb-4">
          <Col md={4}>
    <Card
  className="shadow border-0 rounded-4 p-3 position-relative overflow-hidden"
  style={{
     backgroundColor: "rgb(255 255 255)",
    minHeight: "150px",
    color: "#000",
  }}
>
  {/* Watermark Image Right Side */}
  <img
    src="/certificate.png"
    alt="watermark"
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      height: "90%",
  
      objectFit: "contain",
    }}
  />

  {/* Text Content */}
  <div className="position-relative">
     <h6 className="fw-bold">Total Issued Certificates</h6>
    <h3>{rows.length}</h3>
    <img
    src="/topper.png"
    alt="Certificate"
    width={28}
    height={28}
    className="mt-2"
  />
  </div>
</Card>
          </Col>
        </Row>

        {/* CONTENT */}
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : rows.length === 0 ? (
          <Card className="shadow border-0 rounded-4">
            <Card.Body className="text-center py-5 text-muted">
              No certificates yet
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {rows.map((r) => {
              const pdfHref = `${UPLOADS_BASE}/${r.pdfUrl}`;

              return (
                <Col key={r._id} md={6} lg={4}>
                 <Card
  className="shadow-lg border-0 rounded-4 h-100 position-relative overflow-hidden"
  style={{ transition: "0.3s" }}
>
  {/* Watermark Image Right Side */}
<img
  src="/123.png"
  alt="watermark"
  style={{
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    height: "85%",
    objectFit: "contain",
    zIndex: 1,
    opacity: 0.2
  }}
/>

 <Card.Body className="d-flex flex-column position-relative" style={{ zIndex: 2 }}>
  
  {/* TITLE + STATUS */}
  <div className="d-flex justify-content-between align-items-center mb-2">
    <h6 className="fw-bold mb-0">
      Certificate Name: {r.title}
    </h6>
    <Badge bg="success">
      <AiOutlineSafetyCertificate size={20} /> Issued
    </Badge>
  </div>

  {/* Certificate ID for copy/verification */}
  <div className="fw-bold small text-muted mb-3">
    Certificate ID: {r.certificateId || "—"}
  </div>

  {/* DESCRIPTION */}
 <p
  className="small flex-grow-1"
  style={{ color: "black",fontWeight: "500" }}
>
  {r.description}
</p>

  {/* DATE */}
  <div className="fw-bold small text-muted mb-3">
    Certificate Issued:{" "}
    {new Date(r.createdAt).toLocaleDateString()}
  </div>

 {/* BUTTONS ROW */}
<div className="d-flex gap-2">
  
  {/* VIEW BUTTON */}
  <Button
    className="w-50 rounded-3"
    style={{
      background: "linear-gradient(135deg,#22c55e,#16a34a)",
      border: "none",
    }}
    href={pdfHref}
    target="_blank"
  >
    <FaFilePdf className="me-2" />
    View Certificate
  </Button>

  {/* DOWNLOAD BUTTON */}
  {/* <Button
    className="w-50 rounded-3"
    variant="dark"
    href={pdfHref}
    download
  >
    <FaDownload className="me-2" />
    Download
  </Button> */}

</div>

</Card.Body>
</Card>
                </Col>
              );
            })}
          </Row>
        )}

      </Container>
    </div>
  );
}