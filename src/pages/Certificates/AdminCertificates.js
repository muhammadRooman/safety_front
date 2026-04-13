import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Modal,
  Badge,
} from "react-bootstrap";
import {
  FaFilePdf,
  FaTrash,
  FaCheckCircle,
  FaUsers,
  FaCertificate,
  FaAward
} from "react-icons/fa";

export default function AdminCertificates() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [studentId, setStudentId] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // ✅ Separate filters
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const fileRef = useRef(null);

  const [delId, setDelId] = useState(null);
  const [showDel, setShowDel] = useState(false);

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;
  const UPLOADS_BASE = process.env.REACT_APP_BASE_uploads || "";

  const loadStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/getAllUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents((res.data?.users || []).filter((u) => u.role === "student"));
    } catch {
      toast.error("Failed to load students");
    }
  }, [API_BASE, token]);

  const loadCertificates = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load certificates");
    }
  }, [API_BASE, token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      await Promise.all([loadStudents(), loadCertificates()]);
      setLoading(false);
    })();
  }, [token, loadStudents, loadCertificates]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !studentId || !pdfFile) {
      return toast.error("All fields required");
    }

    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("studentId", studentId);
      fd.append("pdf", pdfFile);

      await axios.post(`${API_BASE}/admin/certificates`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Certificate Sent ✅");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // RESET FORM
      setTitle("");
      setDescription("");
      setStudentId("");
      setPdfFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      loadCertificates();
    } catch {
      toast.error("Error sending certificate");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/admin/certificates/${delId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Deleted");
      setShowDel(false);
      loadCertificates();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ✅ FILTER LOGIC (Name + Email)
  const filteredRows = rows.filter((r) => {
    const nameMatch = r.student?.name
      ?.toLowerCase()
      .includes(nameFilter.toLowerCase());

    const emailMatch = r.student?.email
      ?.toLowerCase()
      .includes(emailFilter.toLowerCase());

    return (
      (!nameFilter || nameMatch) &&
      (!emailFilter || emailMatch)
    );
  });

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
           <h3 className="fw-bold"> <FaAward size={30} color="#ffcc2a" /> Certificate Dashboard</h3>
          <p className="mb-0">  Manage students, certificates, and system activities from one central dashboard. </p>
        </div>

        {/* STATS */}
        <Row className="mb-4">
          <Col md={6}>
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

  {/* Content */}
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

          <Col md={6}>
            <Card
  className="shadow border-0 rounded-4 p-3 position-relative overflow-hidden"
  style={{
  backgroundColor: "rgb(255 255 255)",
    minHeight: "150px",
    color: "#000",
  }}
>
  {/* Watermark Image */}
  <img
    src="/OHS.png"
    alt="watermark"
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      height: "85%",
      opacity: 0.1,
      objectFit: "contain",
    }}
  />

  {/* Content */}
  <div className="position-relative">
    <h6 className="fw-bold ">Total Students</h6>
    <h3>{students.length}</h3>
    <FaUsers size={30} className="text-success" />
  </div>
</Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* FORM */}
          <Col lg={4}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body>
                <h5 className="mb-3">Issue Certificate</h5>

                {success && (
                  <div className="alert alert-success d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    Certificate sent successfully
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Control
                    className="mb-3"
                    placeholder="Certificate Name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="mb-3"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <Form.Select
                    className="mb-3"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Control
                    type="file"
                    className="mb-3"
                    ref={fileRef}
                    onChange={(e) => setPdfFile(e.target.files[0])}
                  />

                  <Button
                    type="submit"
                    className="w-100 rounded-3"
                    style={{
                      background: "linear-gradient(135deg,#22c55e,#16a34a)",
                      border: "none",
                    }}
                  >
                    {saving ? "Sending..." : "Send"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* TABLE */}
          <Col lg={8}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body>

                <h5 className="mb-3">Issued Certificates</h5>

                {/* ✅ FILTERS */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Control
                      placeholder="🔍 Filter by name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Control
                      placeholder="📧 Filter by email..."
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                    />
                  </Col>
                </Row>

                {/* SCROLLABLE TABLE */}
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Cr_Name</th>
                        <th>Students</th>
                        <th>Emails</th>
                        <th>Issue_Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((r) => (
                        <tr key={r._id}>
                          <td>{r.title}</td>
                          <td>{r.student?.name}</td>
                          <td>{r.student?.email}</td>
                          <td>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Badge bg="success">✔ Issued</Badge>
                          </td>
                          <td >
                            <a
                              href={`${UPLOADS_BASE}/${r.pdfUrl}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FaFilePdf className="text-danger me-3" />
                            </a>

                            <FaTrash
                              className="text-danger"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setDelId(r._id);
                                setShowDel(true);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* DELETE MODAL */}
        <Modal show={showDel} onHide={() => setShowDel(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete?</Modal.Title>
          </Modal.Header>
          <Modal.Body>This action cannot be undone.</Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowDel(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

      </Container>
    </div>
  );
}


// import React, { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   Container,
//   Card,
//   Row,
//   Col,
//   Breadcrumb,
//   Form,
//   Button,
//   Table,
//   Modal,
// } from "react-bootstrap";
// import { FaFilePdf, FaTrash } from "react-icons/fa";

// const silent = { showGlobalLoader: false };

// export default function AdminCertificates() {
//   const navigate = useNavigate();
//   const token = useSelector((state) => state.auth.token);

//   const [students, setStudents] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [studentId, setStudentId] = useState("");
//   const [pdfFile, setPdfFile] = useState(null);

//   const [delId, setDelId] = useState(null);
//   const [showDel, setShowDel] = useState(false);

//   const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;
//   const UPLOADS_BASE = process.env.REACT_APP_BASE_uploads || "";

//   const loadStudents = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/auth/getAllUsers`, {
//         headers: { Authorization: `Bearer ${token}` },
//         ...silent,
//       });
//       const list = (res.data?.users || []).filter((u) => u.role === "student");
//       setStudents(list);
//     } catch (e) {
//       toast.error(e.response?.data?.message || "Failed to load students");
//     }
//   }, [API_BASE, token]);

//   const loadCertificates = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/admin/certificates`, {
//         headers: { Authorization: `Bearer ${token}` },
//         ...silent,
//       });
//       setRows(Array.isArray(res.data) ? res.data : []);
//     } catch (e) {
//       toast.error(e.response?.data?.message || "Failed to load certificates");
//     }
//   }, [API_BASE, token]);

//   useEffect(() => {
//     if (!token) return;
//     (async () => {
//       setLoading(true);
//       await Promise.all([loadStudents(), loadCertificates()]);
//       setLoading(false);
//     })();
//   }, [token, loadStudents, loadCertificates]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!title.trim()) {
//       toast.error("Title is required");
//       return;
//     }
//     if (!studentId) {
//       toast.error("Please select a student");
//       return;
//     }
//     if (!pdfFile) {
//       toast.error("Please choose a PDF certificate");
//       return;
//     }

//     setSaving(true);
//     try {
//       const fd = new FormData();
//       fd.append("title", title.trim());
//       fd.append("description", description.trim());
//       fd.append("studentId", studentId);
//       fd.append("pdf", pdfFile);

//       await axios.post(`${API_BASE}/admin/certificates`, fd, {
//         headers: { Authorization: `Bearer ${token}` },
//         timeout: 0,
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity,
//         ...silent,
//       });
//       toast.success("Certificate sent to student");
//       setTitle("");
//       setDescription("");
//       setStudentId("");
//       setPdfFile(null);
//       loadCertificates();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to issue certificate");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!delId) return;
//     try {
//       await axios.delete(`${API_BASE}/admin/certificates/${delId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//         ...silent,
//       });
//       toast.success("Certificate removed");
//       setShowDel(false);
//       setDelId(null);
//       loadCertificates();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Delete failed");
//     }
//   };

//   return (
//     <Container className="py-4">
//       <Breadcrumb>
//         <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
//         <Breadcrumb.Item active>Certificates</Breadcrumb.Item>
//       </Breadcrumb>

//       <h3 className="mb-4 fw-semibold name_heading">Issue certificate (PDF)</h3>

//       <Row className="g-4">
//         <Col lg={5}>
//           <Card className="shadow-sm">
//             <Card.Body>
//               <Card.Title className="h6 mb-3">New certificate</Card.Title>
//               <Form onSubmit={handleSubmit}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>
//                     Title <span className="text-danger">*</span>
//                   </Form.Label>
//                   <Form.Control
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     placeholder="e.g. NEBOSH IGC — Course completion"
//                     required
//                   />
//                 </Form.Group>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Description</Form.Label>
//                   <Form.Control
//                     as="textarea"
//                     rows={3}
//                     value={description}
//                     onChange={(e) => setDescription(e.target.value)}
//                     placeholder="Short note shown to the student"
//                   />
//                 </Form.Group>
//                 <Form.Group className="mb-3">
//                   <Form.Label>
//                     Student <span className="text-danger">*</span>
//                   </Form.Label>
//                   <Form.Select
//                     value={studentId}
//                     onChange={(e) => setStudentId(e.target.value)}
//                     required
//                     disabled={loading}
//                   >
//                     <option value="">Select student</option>
//                     {students.map((s) => (
//                       <option key={s._id} value={s._id}>
//                         {s.name || s.email} ({s.email})
//                       </option>
//                     ))}
//                   </Form.Select>
//                 </Form.Group>
//                 <Form.Group className="mb-3">
//                   <Form.Label>
//                     Certificate PDF <span className="text-danger">*</span>
//                   </Form.Label>
//                   <Form.Control
//                     type="file"
//                     accept="application/pdf"
//                     onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
//                     required
//                   />
//                 </Form.Group>
//                 <Button type="submit" className="buttonColor" disabled={saving || loading}>
//                   {saving ? "Sending…" : "Send certificate"}
//                 </Button>
//               </Form>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col lg={7}>
//           <Card className="shadow-sm">
//             <Card.Body>
//               <Card.Title className="h6 mb-3">Issued certificates</Card.Title>
//               {loading ? (
//                 <p className="text-muted mb-0">Loading…</p>
//               ) : rows.length === 0 ? (
//                 <p className="text-muted mb-0">No certificates issued yet.</p>
//               ) : (
//                 <div className="table-responsive">
//                   <Table hover size="sm" className="align-middle mb-0">
//                     <thead>
//                       <tr>
//                         <th>Title</th>
//                         <th>Student</th>
//                         <th>Date</th>
//                         <th className="text-end">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {rows.map((r) => {
//                         const pdfHref = UPLOADS_BASE ? `${UPLOADS_BASE}/${r.pdfUrl}` : `#`;
//                         return (
//                           <tr key={r._id}>
//                             <td>
//                               <div className="fw-medium">{r.title}</div>
//                               {r.description ? (
//                                 <div className="small text-muted text-truncate" style={{ maxWidth: 220 }}>
//                                   {r.description}
//                                 </div>
//                               ) : null}
//                             </td>
//                             <td>
//                               {r.student?.name || "—"}
//                               <div className="small text-muted">{r.student?.email}</div>
//                             </td>
//                             <td className="small text-muted">
//                               {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
//                             </td>
//                             <td className="text-end">
//                               <Button
//                                 variant="link"
//                                 size="sm"
//                                 className="p-1 me-1"
//                                 href={pdfHref}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 title="Open PDF"
//                               >
//                                 <FaFilePdf className="text-danger" size={20} />
//                               </Button>
//                               <Button
//                                 variant="link"
//                                 size="sm"
//                                 className="p-1 text-danger"
//                                 title="Delete"
//                                 onClick={() => {
//                                   setDelId(r._id);
//                                   setShowDel(true);
//                                 }}
//                               >
//                                 <FaTrash size={16} />
//                               </Button>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </Table>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       <Modal show={showDel} onHide={() => setShowDel(false)} centered backdrop="static" keyboard={false}>
//         <Modal.Header closeButton>
//           <Modal.Title>Remove certificate?</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>The student will no longer see this certificate. The PDF file will be deleted.</Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowDel(false)}>
//             Cancel
//           </Button>
//           <Button variant="danger" onClick={handleDelete}>
//             Delete
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// }
