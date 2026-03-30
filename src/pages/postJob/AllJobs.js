import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import DataTable from "react-data-table-component";
import {
  Container,
  Breadcrumb,
  Button,
  Badge,
  Modal,
  Card,
} from "react-bootstrap";
import { MdDelete, MdEdit } from "react-icons/md";

const API = process.env.REACT_APP_BASE_ADMIN_API;

export default function AllJobs() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [rows, setRows] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delId, setDelId] = useState(null);
  const [showDel, setShowDel] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/userDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data?.user);
    } catch {
      setUser(null);
    }
  }, [token]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/job-post`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRows(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async () => {
    if (!delId) return;
    try {
      await axios.delete(`${API}/admin/job-post/${delId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Job removed");
      setShowDel(false);
      setDelId(null);
      fetchJobs();
    } catch {
      toast.error("Delete failed");
    }
  };

  const isTeacher = user?.role === "teacher";

  const columns = [
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
      wrap: true,
    },
    {
      name: "Type",
      width: "110px",
      cell: (row) => (
        <Badge bg={row.postMode === "image" ? "info" : "secondary"}>
          {row.postMode === "image" ? "Image" : "Manual"}
        </Badge>
      ),
    },
    {
      name: "Company",
      selector: (row) => row.companyName || "—",
    },
    {
      name: "Status",
      width: "110px",
      cell: (row) => (
        <Badge
          className={row.status === "published" ? "bg-light-green" : "bg-warning text-dark"}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      name: "Posted",
      width: "120px",
      selector: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
    },
  ];

  if (isTeacher) {
    columns.push({
      name: "Action",
      width: "130px",
      cell: (row) => (
        <div className="d-flex gap-1">
        <OverlayTrigger
        placement="top"
        overlay={<Tooltip>Edit Job</Tooltip>}
      >
        <Button
          size="sm"
          variant="success"
          className="border-0"
          onClick={() => navigate(`/dashboard/post-job/${row._id}`)}
        >
          <MdEdit size={20} />
        </Button>
      </OverlayTrigger>
      <OverlayTrigger
      placement="top"
      overlay={<Tooltip>Delete Job</Tooltip>}
    >
      <Button
        size="sm"
        variant="danger"
        onClick={() => {
          setDelId(row._id);
          setShowDel(true);
        }}
      >
        <MdDelete size={20} />
      </Button>
    </OverlayTrigger>
        </div>
      ),
    });
  }

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>All Jobs</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="mb-0 fw-semibold name_heading">All Jobs</h3>
        {isTeacher && (
          <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Click to create a new job post</Tooltip>}
        >
          <Button
            className="buttonColor"
            onClick={() => navigate("/dashboard/post-job")}
          >
            Post a Job
          </Button>
        </OverlayTrigger>
        )}
      </div>

      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={rows}
            progressPending={loading}
            pagination
            highlightOnHover
            responsive
          />
        </Card.Body>
      </Card>

      <Modal show={showDel} onHide={() => setShowDel(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete job?</Modal.Title>
        </Modal.Header>
        <Modal.Body>This cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDel(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
