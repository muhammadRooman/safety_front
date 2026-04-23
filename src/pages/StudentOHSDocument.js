
import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Alert,
  Spinner,
  Row,
  Col,
  Badge,
  Button
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaFile, FaDownload, FaEye, FaBullhorn } from 'react-icons/fa';

const StudentOHSDocument = () => {
  const token = useSelector((state) => state.auth.token);
  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_BASE}/ohs-documents/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to fetch documents'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
      ' ' +
      sizes[i]
    );
  };

  return (
    <Container fluid className="py-4">

      {/* Marquee */}
      <div className="marquee-box mb-4">
        <div className="marquee-content">
          <FaBullhorn className="me-2" />
          To checkout company profile, you can see the company profile below.
        </div>
      </div>

      {/* Heading */}
      <div className="mb-4">
             <h3 className="mb-4 fw-semibold name_heading">OHS Academy Documents</h3>

        <p className="text-muted">
          Read and review Occupational Health and Safety documents
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading documents...</p>
        </div>
      ) : documents.length > 0 ? (
        <Row>
          {documents.map((doc) => (
            <Col md={6} lg={6} key={doc._id} className="mb-4">

              <Card className="shadow-sm hover-card h-100 overflow-hidden">

                <Row className="g-0 h-100">

                  {/* Left Image */}
                  <Col md={5}>
                    <img
                      src="/ohs-main-page.PNG"
                      alt="Document"
                      className="w-100 h-100"
                      style={{
                        objectFit: "fill",
                        minHeight: "100%"
                      }}
                    />
                  </Col>

                  {/* Right Content */}
                  <Col md={7}>

                    <Card.Header
                      className="text-white border-0"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(49 67 77), rgb(49 67 77))"
                      }}
                    >
                      <FaFile className="me-2" />
                      <strong>Document Title:</strong> {doc.title}
                    </Card.Header>

                    <Card.Body>
                      <Card.Text className="text-muted">
                        <strong>Description:</strong>{" "}
                        {doc.description || "No description available"}
                      </Card.Text>

                      <div className="mb-3">
                        <div className="mb-2">
                          <small className="text-muted">
                            <strong>File Size:</strong>{" "}
                            {formatFileSize(doc.fileSize)}
                          </small>
                        </div>

                        <div className="mb-2">
                          <small className="text-muted">
                            <strong>Uploaded:</strong>{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </small>
                        </div>

                        <div>
                          <small className="text-muted">
                            <strong>By:</strong>{" "}
                            {doc.uploadedBy?.name || "Admin"}
                          </small>
                        </div>
                      </div>

                      {doc.isActive && (
                        <Badge bg="success">
                          Active
                        </Badge>
                      )}
                    </Card.Body>

                    <Card.Footer className="bg-light border-0">
                      <div className="d-grid gap-2">

                        <Button
                          variant="primary"
                          href={`${API_BASE}`.replace("/api", "") + `/uploads/documents/${doc.fileName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaEye className="me-2" />
                          View PDF
                        </Button>

                        <Button
                          variant="outline-secondary"
                          href={`${API_BASE}`.replace("/api", "") + `/uploads/documents/${doc.fileName}`}
                          download={doc.title}
                        >
                          <FaDownload className="me-2" />
                          Download
                        </Button>

                      </div>
                    </Card.Footer>

                  </Col>
                </Row>

              </Card>

            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info">
          <FaFile className="me-2" />
          No OHS documents available at this time.
        </Alert>
      )}

      <style>{`
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
        }

        .marquee-box {
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, rgb(49 67 77), rgb(49 67 77))
          color: white;
          padding: 12px 0;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .marquee-content {
          display: inline-block;
          white-space: nowrap;
          padding-left: 100%;
          animation: marqueeMove 18s linear infinite;
        }

        @keyframes marqueeMove {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>

    </Container>
  );
};

export default StudentOHSDocument;


// import React, { useState, useEffect } from 'react';
// import { Container, Card, Alert, Spinner, Row, Col, Badge, Button } from 'react-bootstrap';
// import { useSelector } from 'react-redux';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { FaFile, FaDownload, FaEye } from 'react-icons/fa';

// const StudentOHSDocument = () => {
//   const token = useSelector((state) => state.auth.token);
//   const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

//   const [documents, setDocuments] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Fetch OHS documents
//   const fetchDocuments = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${API_BASE}/ohs-documents/`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setDocuments(response.data.documents || []);
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'Failed to fetch documents');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDocuments();
//   }, [token]);

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
//   };

//   return (
//     <Container fluid className="py-4">
//       <div className="mb-4">
//         <h2>
//           <FaFile className="me-2" />
//           OHS Documents
//         </h2>
//         <p className="text-muted">
//           Read and review Occupational Health and Safety documents
//         </p>
//       </div>

//       {loading ? (
//         <div className="text-center py-5">
//           <Spinner animation="border" variant="primary" />
//           <p className="mt-3">Loading documents...</p>
//         </div>
//       ) : documents.length > 0 ? (
//         <Row>
//           {documents.map((doc) => (
//          <Col md={6} lg={6} key={doc._id} className="mb-4">
//   <Card className="shadow-sm hover-card h-100 overflow-hidden">
    
//     <Row className="g-0 h-100">

//       {/* Left Side Image */}
//       <Col md={5}>
//         <img
//           src="/ohs-main-page.PNG"
//           alt="Document"
//           className="w-100 h-100"
//           style={{
//             objectFit: "fill",
//             minHeight: "100%"
//           }}
//         />
//       </Col>

//       {/* Right Side Content */}
//       <Col md={7}>
//         <Card.Header
//           className="text-white border-0"
//           style={{
//             background:
//               "linear-gradient(135deg, rgb(221, 182, 53), rgb(227, 180, 38))"
//           }}
//         >
//           <FaFile className="me-2" />
//           <strong>Document Title:</strong> {doc.title}
//         </Card.Header>

//         <Card.Body>
//           <Card.Text className="text-muted">
//             <strong>Description:</strong>{" "}
//             {doc.description || "No description available"}
//           </Card.Text>

//           <div className="mb-3">
//             <div className="mb-2">
//               <small className="text-muted">
//                 <strong>File Size:</strong> {formatFileSize(doc.fileSize)}
//               </small>
//             </div>

//             <div className="mb-2">
//               <small className="text-muted">
//                 <strong>Uploaded:</strong>{" "}
//                 {new Date(doc.createdAt).toLocaleDateString()}
//               </small>
//             </div>

//             <div>
//               <small className="text-muted">
//                 <strong>By:</strong> {doc.uploadedBy?.name || "Admin"}
//               </small>
//             </div>
//           </div>

//           {doc.isActive && (
//             <Badge bg="success">
//               Active
//             </Badge>
//           )}
//         </Card.Body>

//         <Card.Footer className="bg-light border-0">
//           <div className="d-grid gap-2">

//             <Button
//               variant="primary"
//               href={`${API_BASE}`.replace("/api", "") + `/uploads/documents/${doc.fileName}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="d-flex align-items-center justify-content-center"
//             >
//               <FaEye className="me-2" />
//               View PDF
//             </Button>

//             <Button
//               variant="outline-secondary"
//               href={`${API_BASE}`.replace("/api", "") + `/uploads/documents/${doc.fileName}`}
//               download={doc.title}
//               className="d-flex align-items-center justify-content-center"
//             >
//               <FaDownload className="me-2" />
//               Download
//             </Button>

//           </div>
//         </Card.Footer>
//       </Col>

//     </Row>

//   </Card>
// </Col>
//           ))}
//         </Row>
//       ) : (
//         <Alert variant="info">
//           <FaFile className="me-2" />
//           No OHS documents available at this time. Please check back later.
//         </Alert>
//       )}

//       <style>{`
//         .hover-card {
//           transition: transform 0.3s ease, box-shadow 0.3s ease;
//         }
//         .hover-card:hover {
//           transform: translateY(-5px);
//           box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
//         }
//       `}</style>
//     </Container>
//   );
// };

// export default StudentOHSDocument;
