import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash, FaCheck, FaEye } from 'react-icons/fa';
import './AdminStudentRegistrations.css';

const AdminStudentRegistrations = () => {
  const { t } = useTranslation();
  const token = useSelector((state) => state.auth.token);

  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newStatus, setNewStatus] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  // Fetch all registrations
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/student-registrations/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(response.data.registrations || []);
      filterRegistrations(response.data.registrations || [], searchTerm, statusFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [token]);

  // Filter registrations
  const filterRegistrations = (data, search, status) => {
    let filtered = data;

    if (status !== 'all') {
      filtered = filtered.filter((reg) => reg.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (reg) =>
          reg.name.toLowerCase().includes(search.toLowerCase()) ||
          reg.email.toLowerCase().includes(search.toLowerCase()) ||
          reg.courseName.toLowerCase().includes(search.toLowerCase()) ||
          reg.user?.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredRegistrations(filtered);
  };

  useEffect(() => {
    filterRegistrations(registrations, searchTerm, statusFilter);
  }, [searchTerm, statusFilter, registrations]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setEditFormData({
      name: registration.name,
      email: registration.email,
      courseName: registration.courseName,
      language: registration.language,
    });
    setShowDetailModal(true);
  };

  const handleStatusChange = async (registrationId, newStatusValue) => {
    try {
      setLoading(true);
      await axios.patch(
        `${API_BASE}/student-registrations/${registrationId}/status`,
        { status: newStatusValue },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(`Status updated to ${newStatusValue}`);
      fetchRegistrations();
      setShowDetailModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (registration) => {
    setSelectedRegistration(registration);
    setEditFormData({
      name: registration.name,
      email: registration.email,
      courseName: registration.courseName,
      language: registration.language,
    });
    setShowModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('name', editFormData.name);
      submitData.append('email', editFormData.email);
      submitData.append('courseName', editFormData.courseName);
      submitData.append('language', editFormData.language);

      await axios.put(
        `${API_BASE}/student-registrations/${selectedRegistration._id}`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Registration updated successfully');
      setShowModal(false);
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update registration');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (registrationId) => {
    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE}/student-registrations/${registrationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Registration deleted successfully');
      setDeleteConfirmId(null);
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="admin-registrations py-4">
      <h3 className="mb-4 fw-semibold name_heading">
        <FaCheck className="me-2" />
     Student Registrations Management
      </h3>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <h6 className="text-muted">Total Registrations</h6>
              <h2 className="text-primary">{registrations.length}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <h6 className="text-muted">Pending</h6>
              <h2 className="text-warning">
                {registrations.filter((r) => r.status === 'pending').length}
              </h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <h6 className="text-muted">Approved</h6>
              <h2 className="text-success">
                {registrations.filter((r) => r.status === 'approved').length}
              </h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Search (Name, Email, Course)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filter by Status</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              disabled={loading}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Registrations Table */}
      {loading && !registrations.length ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading registrations...</p>
        </div>
      ) : filteredRegistrations.length > 0 ? (
        <div className="table-responsive registrations-table-wrapper">
          <Table hover className="registrations-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Course</th>
                <th>login email</th>
                <th>Language</th>
                <th>Status</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((registration) => (
                <tr key={registration._id}>
                  <td>
                    <strong>{registration.name}</strong>
                  </td>
                  <td>{registration.email}</td>
                  <td>{registration.phone}</td>
                  <td>{registration.courseName}</td>
                  <td>{registration.user?.email || 'N/A'}</td>
                  <td>{registration.language}</td>
                  <td>
                    <Badge bg={registration.status === 'approved' ? 'success' : 'warning'}>
                      {registration.status}
                    </Badge>
                  </td>
                  <td>
                    {registration.profileImage ? (
                      <img
                        src={`${process.env.REACT_APP_BASE_ADMIN_API}`.replace('/api', '') + `/uploads/registrations/${registration.profileImage}`}
                        alt={registration.name}
                        className="table-image"
                      />
                    ) : (
                      <span className="text-muted">No image</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => handleViewDetails(registration)}
                        title="View Details"
                        disabled={loading}
                      >
                        <FaEye />
                      </Button>
                      {/* <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(registration)}
                        title="Edit"
                        disabled={loading}
                      >
                        <FaEdit />
                      </Button> */}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirmId(registration._id)}
                        title="Delete"
                        disabled={loading}
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
        <div className="alert alert-info" role="alert">
          No registrations found.
        </div>
      )}

      {/* View Details Modal */}
    <Modal 
  show={showDetailModal} 
  onHide={() => setShowDetailModal(false)} 
  size="lg" 
  centered
  className="registration-modal"
>
  {/* Header with Background Color */}
  <Modal.Header closeButton className="bg-light">
    <Modal.Title className="fw-bold text-primary">
      <i className="bi bi-person-badge me-2"></i>Registration Details
    </Modal.Title>
  </Modal.Header>

  <Modal.Body className="p-4">
    {selectedRegistration ? (
      <div>
        <Row className="align-items-center mb-4">
          {/* Profile Image Section */}
          <Col md={4} className="text-center">
            <div className="shadow-sm p-2 bg-white rounded border">
              {selectedRegistration.profileImage ? (
                <img
                  src={`${process.env.REACT_APP_BASE_ADMIN_API}`.replace('/api', '') + `/uploads/registrations/${selectedRegistration.profileImage}`}
                  alt={selectedRegistration.name}
                  className="img-fluid rounded shadow-sm"
                  style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="bg-light rounded d-flex flex-column align-items-center justify-content-center text-muted"
                  style={{ height: '220px' }}
                >
                  <i className="bi bi-person-fill-exclamation display-4"></i>
                  <p className="mt-2 small">No Profile Image</p>
                </div>
              )}
            </div>
          </Col>

          {/* Core Info Section */}
          <Col md={8}>
            <div className="ps-md-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h3 className="mb-0 fw-bold text-dark">{selectedRegistration.name}</h3>
                <Badge 
                  pill 
                  bg={selectedRegistration.status === 'approved' ? 'success' : 'warning'}
                  className="px-3 py-2 text-capitalize"
                >
                  {selectedRegistration.status}
                </Badge>
              </div>
              
              <hr className="my-3 opacity-50" />

              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block">Email Address</small>
                  <span className="fw-semibold text-break">{selectedRegistration.email}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Course Name</small>
                  <span className="fw-semibold text-primary">{selectedRegistration.courseName}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Preferred Language</small>
                  <span className="fw-semibold">{selectedRegistration.language}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Registration Date</small>
                  <span className="fw-semibold">{new Date(selectedRegistration.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Action Section */}
        <div className="bg-light p-3 rounded border">
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-uppercase text-muted">
                  Update Status
                </Form.Label>
                <Form.Select
                  className="form-select-lg border-0 shadow-sm"
                  value={newStatus || selectedRegistration.status}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              {newStatus && selectedRegistration.status !== newStatus && (
                <div className="alert alert-primary mb-0 py-2 border-0 shadow-sm animate__animated animate__fadeIn">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Change to <strong>{newStatus}</strong>?
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>
    ) : (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Loading data...</p>
      </div>
    )}
  </Modal.Body>

  <Modal.Footer className="border-0 bg-light p-3">
    <Button variant="outline-secondary" className="px-4" onClick={() => setShowDetailModal(false)}>
      Cancel
    </Button>
    {newStatus && selectedRegistration.status !== newStatus && (
      <Button
        variant="primary"
        className="px-4 shadow"
        onClick={() => handleStatusChange(selectedRegistration._id, newStatus)}
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Confirm Update'}
      </Button>
    )}
  </Modal.Footer>
</Modal>

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Registration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.name || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={editFormData.email || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.courseName || ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    courseName: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Language</Form.Label>
              <Form.Select
                value={editFormData.language || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, language: e.target.value })
                }
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Pashto">Pashto</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleEditSubmit}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteConfirmId} onHide={() => setDeleteConfirmId(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this registration? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(deleteConfirmId)}
            disabled={loading}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminStudentRegistrations;
