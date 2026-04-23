import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Table, Badge, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTrash, FaEye, FaUpload, FaEdit } from 'react-icons/fa';

const AdminOHSDocument = () => {
  const token = useSelector((state) => state.auth.token);
  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch all OHS documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/ohs-documents/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        setFile(null);
        e.target.value = '';
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        setFile(null);
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!file && !editingId) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (file) {
        formData.append('document', file);
      }

      if (editingId) {
        // Update existing document
        await axios.put(
          `${API_BASE}/ohs-documents/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Document updated successfully');
      } else {
        // Upload new document
        await axios.post(
          `${API_BASE}/ohs-documents/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Document uploaded successfully');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setEditingId(null);
      setShowModal(false);

      // Refresh documents
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload/update document');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (document) => {
    setEditingId(document._id);
    setTitle(document.title);
    setDescription(document.description);
    setFile(null);
    setShowModal(true);
  };

  const handleDelete = async (documentId) => {
    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE}/ohs-documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Document deleted successfully');
      setDeleteConfirmId(null);
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTitle('');
    setDescription('');
    setFile(null);
    setEditingId(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
     

         
          <h3 className="mb-4 fw-semibold name_heading"> OHS Documents Management</h3>
       
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          disabled={uploading || loading}
        >
          <FaUpload className="me-2" />
          Upload New Document
        </Button>
      </div>

      {/* Statistics */}
      <Card className="mb-4">
        <Card.Body>
          <h5>Total Documents: <Badge bg="primary">{documents.length}</Badge></h5>
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? 'Edit OHS Document' : 'Upload OHS Document'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Document Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Safety Guidelines 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                required
              />
              <Form.Text className="text-muted">
                A descriptive title for the document
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter document description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>PDF File {!editingId && '*'}</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
                required={!editingId}
              />
              <Form.Text className="text-muted">
                Maximum file size: 50MB. Only PDF files allowed.
              </Form.Text>
              {file && (
                <div className="mt-2">
                  <small className="text-success">
                    ✓ {file.name} ({formatFileSize(file.size)})
                  </small>
                </div>
              )}
            </Form.Group>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {editingId ? 'Updating...' : 'Uploading...'}
                  </>
                ) : (
                  editingId ? 'Update Document' : 'Upload Document'
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Documents Table */}
      {loading && !documents.length ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading documents...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="table-responsive">
          <Table striped hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>File Size</th>
                <th>Uploaded By</th>
                <th>Uploaded At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <strong>{doc.title}</strong>
                  </td>
                  <td>{doc.description || '-'}</td>
                  <td>{formatFileSize(doc.fileSize)}</td>
                  <td>{doc.uploadedBy?.name || 'Unknown'}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Badge bg={doc.isActive ? 'success' : 'secondary'}>
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        href={`${API_BASE}`.replace('/api', '') + `/uploads/documents/${doc.fileName}`}
                        target="_blank"
                        title="View PDF"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                        disabled={uploading || loading}
                        title="Edit"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirmId(doc._id)}
                        disabled={uploading || loading}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Alert variant="info">
          No OHS documents uploaded yet. Click "Upload New Document" to get started.
        </Alert>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteConfirmId} onHide={() => setDeleteConfirmId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this document? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteConfirmId(null)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(deleteConfirmId)}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOHSDocument;
