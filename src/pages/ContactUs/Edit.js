import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import DataTable from "react-data-table-component";
import axios from "axios";
import { toast } from "react-toastify";
import Columns from "./Columns";
import { useSelector } from "react-redux";
import {
  Breadcrumb,
  Button,
  Container,
  Row,
  Col,
  Card,
  Form,
  Modal,
} from "react-bootstrap";
import { CSVLink } from "react-csv";
import { useTranslation } from "react-i18next";

export default function ContactUs() {
  const API_BASE = "http://localhost:8082/api";
  const { t } = useTranslation();
  const navigate = useNavigate();

  const token = useSelector((state) => state.auth.token);

  const [blogs, setBlogs] = useState([]);
  const [filterText, setFilterText] = useState("");

  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // ---------------- Fetch Contacts ----------------

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/contact`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
console.log("ssdsd",response.data.users)
      setBlogs(response.data.users || []);
    } catch (err) {
      toast.error("Error fetching contacts");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // ---------------- Search Filter ----------------

  const filteredItems = blogs.filter((item) =>
    item.name?.toLowerCase().includes(filterText.toLowerCase())
  );

  // ---------------- Edit ----------------

  const handleEdit = (row) => {
    setIsEdit(true);
    setEditId(row._id);

    setNewStudent({
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      message: row.message || "",
    });

    setShowAddModal(true);
  };

  // ---------------- Delete ----------------

  const handleDelete = (row) => {
    setDelId(row._id);
    setOpen(true);
  };

  // const DeleteBlog = async () => {
  //   try {
  //     const res = await axios.delete(
  //       `http://localhost:8082/api/auth/contact/${delId}`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     toast.success(res.data.message);

  //     setBlogs((prev) => prev.filter((b) => b._id !== delId));
  //     setOpen(false);
  //   } catch (err) {
  //     toast.error("Delete failed");
  //   }
  // };

  // ---------------- Form Change ----------------

  const handleAddStudentChange = (e) => {
    const { name, value } = e.target;

    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const columns = Columns({ handleEdit, handleDelete });

  // ---------------- CSV ----------------

  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Message", key: "message" },
    { label: "Created At", key: "createdAt" },
  ];

  const csvData = filteredItems.map((item) => ({
    name: item.name,
    email: item.email,
    phone: item.phone,
    message: item.message,
    createdAt: new Date(item.createdAt).toLocaleDateString(),
  }));

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
          Dashboard
        </Breadcrumb.Item>

        <Breadcrumb.Item active>Contact Messages</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mb-4 justify-content-between">
        <Col>
          <h3 className="mb-0 fw-semibold name_heading">Contact Messages</h3>
        </Col>

        
      </Row>

      <Card>
        <Card.Body>

          {/* Search */}
          <Form.Control
            type="text"
            placeholder="Search by name..."
            className="mb-3"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />

          <DataTable
            columns={columns}
            data={filteredItems}
            pagination
            highlightOnHover
            responsive
          />
        </Card.Body>
      </Card>

      {/* Delete Modal */}

      <Modal show={open} onHide={() => setOpen(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete this contact?
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button variant="danger" >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

    
    </Container>
  );
}
