import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import Select from "react-select";
import { IoMdRefresh } from "react-icons/io";
import DataTable from "react-data-table-component";
import { io } from "socket.io-client";
import axios from "axios";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { InputGroup } from "react-bootstrap";
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
import { FaDownload } from "react-icons/fa";

export default function StudentEnrollList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const id = useSelector((state) => state.auth.id);
  const token = useSelector((state) => state.auth.token);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState("");
  const [user, setUser] = useState(null);
  const [cSVHide, setCSVHide] = useState(false);
  const [onlineStudentIds, setOnlineStudentIds] = useState([]);
  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";

  // Add/Edit Student States
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    subject: [],
    password: "",
  });

  // Provide Google Meet Link States
  const [provideLinkId, setProvideLinkId] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [loadingLink, setLoadingLink] = useState(false);

  const subjectOptions = [
    { value: "NEBOSH", label: "NEBOSH" },
    { value: "IOSH", label: "IOSH" },
    { value: "OSHA", label: "OSHA" },
    { value: "ISO Safety", label: "ISO Safety" },
    { value: "RIGGER3", label: "RIGGER3" },
    { value: "AD Safety", label: "AD Safety" },
    { value: "First Aid", label: "First Aid" },
    { value: "Fire Safety", label: "Fire Safety" },
  ];

  // Fetch User
  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data.user);
    } catch (err) {
      toast.error("Error fetching user");
    }
  };

  // Fetch Students
  const fetchBlogs = async (role) => {
    try {
      let response;
      if (role === "teacher") {
        response = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCSVHide(true);
      } else {
        setCSVHide(false);
      }

      if (response) {
        setBlogs(response.data.users || []);
      }
    } catch (err) {
      toast.error("Error fetching students");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Listen to socket events for online students so status shows in enroll list
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    s.on("online-students", ({ studentIds }) => {
      if (!Array.isArray(studentIds)) return;
      setOnlineStudentIds((prev) => {
        const uniq = new Set([...prev.map(String), ...studentIds.map(String)]);
        return Array.from(uniq);
      });
    });

    s.on("student-online", ({ studentId }) => {
      if (!studentId) return;
      const sid = String(studentId);
      setOnlineStudentIds((prev) =>
        prev.includes(sid) ? prev : [...prev, sid]
      );
    });

    s.on("student-offline", ({ studentId }) => {
      if (!studentId) return;
      const sid = String(studentId);
      setOnlineStudentIds((prev) => prev.filter((id) => String(id) !== sid));
    });

    // Emit after listeners to avoid missing the initial `online-students` emit
    s.emit("join-admin");

    return () => {
      s.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (user?.role) {
      fetchBlogs(user.role);
    }
  }, [user]);

  // Filtered Items
  const filteredItems = blogs.filter((item) => {
    const nameMatch = item.name?.toLowerCase().includes(filterText.toLowerCase());
    const subjects = Array.isArray(item.subject)
      ? item.subject
      : item.subject
      ? [item.subject]
      : [];
    const courseMatch = !filterCourse || subjects.includes(filterCourse);

    // Active = online (socket), Unactive = offline
    const isActive = onlineStudentIds.includes(String(item._id));
    const statusMatch =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? isActive
        : statusFilter === "inactive"
        ? !isActive
        : true;

    return nameMatch && courseMatch && statusMatch;
  });

  // Handle Edit Student
  const handleEdit = (row) => {
    setIsEdit(true);
    setEditId(row._id);
    setNewStudent({
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      subject: Array.isArray(row.subject) ? row.subject : row.subject ? [row.subject] : [],
      password: "",
    });
    setShowAddModal(true);
  };

  const handleDelete = (row) => {
    setDelId(row._id);
    setOpen(true);
  };

  // ==================== PROVIDE GOOGLE MEET LINK ====================
// ==================== PROVIDE GOOGLE MEET LINK ====================
const handleProvideLink = async (row) => {
  console.log(row)
  setProvideLinkId(row._id);
  setMeetLink("");           // reset first
  setShowLinkModal(true);
  setLoadingLink(true);

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BASE_ADMIN_API}/admin/provide-link/${row._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Full response from backend:", response.data); // ← For debugging

    // ✅ Correct way to access the link
    const existingLink = response.data?.data?.link || response.data?.link;

    if (existingLink) {
      setMeetLink(existingLink);
      console.log("✅ Existing link loaded successfully:", existingLink);
    } else {
      console.log("ℹ️ No link found for this student");
    }
  } catch (err) {
    if (err.response?.status === 404) {
      console.log("ℹ️ No link assigned yet (404) - Normal behavior");
    } else {
      console.error("Error fetching link:", err.response?.data || err.message);
    }
  } finally {
    setLoadingLink(false);
  }
};
  // Submit / Update Link
  const handleSubmitLink = async () => {
    if (!meetLink.trim()) {
      toast.error("Please enter a valid Google Meet link");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/provide-link/${provideLinkId}`,
        { link: meetLink.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Google Meet link saved successfully!");
      setShowLinkModal(false);
      setMeetLink("");
      setProvideLinkId("");

      // Refresh student list
      if (user?.role) fetchBlogs(user.role);
    } catch (err) {
      toast.error("Failed to save Google Meet link");
    }
  };

  const handleDeleteLink = async () => {
    if (!provideLinkId) return;
    try {
      // Find current link doc for selected student first
      const getRes = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/provide-link/${provideLinkId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const linkDocId = getRes?.data?.data?._id;
      if (!linkDocId) {
        toast.error("No link found for this student");
        return;
      }

      await axios.delete(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/provide-link/${linkDocId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Google Meet link deleted successfully!");
      setMeetLink("");
      setShowLinkModal(false);
      setProvideLinkId("");
      if (user?.role) fetchBlogs(user.role);
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error("No link found for this student");
      } else {
        toast.error("Failed to delete Google Meet link");
      }
    }
  };

  // Delete Student
  const DeleteBlog = async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_BASE_ADMIN_API}/auth/deleteUser/${delId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Student deleted successfully");
      setBlogs((prev) => prev.filter((b) => b._id !== delId));
      setOpen(false);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleAddStudentChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEdit) {
        response = await axios.put(
          `${process.env.REACT_APP_BASE_ADMIN_API}/auth/updateStudent/${editId}`,
          newStudent,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Student updated successfully");
        setBlogs((prev) =>
          prev.map((item) => (item._id === editId ? response.data.user : item))
        );
      } else {
        response = await axios.post(
          `${process.env.REACT_APP_BASE_ADMIN_API}/auth/signup`,
          newStudent,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Student created successfully");
        setBlogs((prev) => [response.data.user, ...prev]);
      }

      setShowAddModal(false);
      setIsEdit(false);
      setNewStudent({ name: "", email: "", phone: "", subject: [], password: "" });
    } catch (err) {
      toast.error("User already exists or error occurred");
    }
  };

  const columns = Columns({
    handleEdit,
    handleDelete,
    handleProvideLink,
    onlineStudentIds,
  });

  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Subject", key: "subject" },
    { label: "Created At", key: "createdAt" },
  ];

  const csvData = filteredItems.map((item) => ({
    name: item.name,
    email: item.email,
    phone: item.phone,
    subject: Array.isArray(item.subject) ? item.subject.join(", ") : item.subject,
    createdAt: new Date(item.createdAt).toLocaleDateString(),
  }));

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>All Students</Breadcrumb.Item>
      </Breadcrumb>

     

      <Row className="mb-4 align-items-center justify-content-between">
      <Col xs={12} md="auto" className="mb-2 mb-md-0">
        <h3 className=" mb-0 fw-semibold name_heading">{t("student List")}</h3>
      </Col>
    <Col
xs={12}
md="auto"
className="d-flex gap-2 justify-content-end flex-nowrap"
>
{filteredItems.length > 0 && (
  <CSVLink
    data={csvData}
    headers={csvHeaders}
    filename="student_records.csv"
    className="btn csv px-3"
  >
    <FaDownload /> Export <span className="d-none d-sm-inline"></span>
  </CSVLink>
)}
<Button className="action-dark" onClick={() => { fetchBlogs(user.role) }}><IoMdRefresh size={25}/></Button>
<Button
  className="buttonColor px-3 d-flex align-items-center"
  onClick={() => { setIsEdit(false); setShowAddModal(true); }}
>
  <IoMdAdd size={25} />Add Student
  <span className="ms-1 d-none d-sm-inline"></span>
</Button>
</Col>
    </Row>


    {cSVHide && (
      <Row className="mb-3">
        <Col xs={6} md={4}>
          <Form.Control
            type="text"
            placeholder="Search by name"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </Col>
    
        <Col xs={6} md={4}>
          <Form.Select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All courses</option>
            {subjectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={4}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Students</option>
            <option value="active">🟢 Active (Online)</option>
            <option value="inactive">🔴 Unactive (Offline)</option>
          </Form.Select>
        </Col>
      </Row>
    )}
      <Card>
        <Card.Body>
          <DataTable
            columns={columns}
            data={filteredItems}
            pagination
            onRowClicked={(row) => navigate(`/dashboard/messages`)} 
            highlightOnHover
            responsive
          />
        </Card.Body>
      </Card>

      {/* Delete Modal */}
      <Modal show={open} onHide={() => setOpen(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Delete Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this student?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={DeleteBlog}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Student Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static" keyboard={false}>
        <Form onSubmit={handleAddStudentSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isEdit ? "Edit Student" : "Add Student"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Name, Email, Phone, Courses, Password fields remain same as before */}
            <Form.Group className="mb-3">
              <Form.Label>Name <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control type="text" name="name" value={newStudent.name} onChange={handleAddStudentChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control type="email" name="email" value={newStudent.email} onChange={handleAddStudentChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control type="text" name="phone" value={newStudent.phone} onChange={handleAddStudentChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Courses for this student</Form.Label>
              <Form.Text className="d-block mb-2 text-danger" style={{ fontSize: "12px" }}>
                ⚠ Only selected courses will be assigned to this student.
              </Form.Text>
              <Select
                isMulti
                options={subjectOptions}
                value={subjectOptions.filter((option) => newStudent.subject.includes(option.value))}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                onChange={(selected) =>
                  setNewStudent((prev) => ({
                    ...prev,
                    subject: selected ? selected.map((item) => item.value) : [],
                  }))
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={newStudent.password}
                  onChange={handleAddStudentChange}
                />
                <InputGroup.Text style={{ cursor: "pointer" }} onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" className="buttonColor">
              {isEdit ? "Update" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

     {/* Provide Google Meet Link Modal */}
<Modal
  show={showLinkModal}
  onHide={() => {
    setShowLinkModal(false);
    setMeetLink("");
    setProvideLinkId("");
  }}
  centered
  backdrop="static"
  keyboard={false}
>
  <Modal.Header closeButton>
    <Modal.Title>Provide Google Meet Link</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <p style={{ fontSize: "14px", color: "#555" }}>
      Enter or update the Google Meet link for this student.
    </p>

    <Form.Group className="mb-3">
      <Form.Label>Google Meet Link</Form.Label>
      <Form.Control
        type="url"
        placeholder="https://meet.google.com/xxxxxxxxxxx"
        value={meetLink}
        onChange={(e) => setMeetLink(e.target.value)}
        disabled={loadingLink}
      />
      {loadingLink && (
        <small className="text-muted">Loading existing link...</small>
      )}
    </Form.Group>

    {/* <p
      className="blink-text"
      style={{
        fontWeight: "bold",
        color: meetLink ? "green" : "red",
        fontSize: "14px",
        animation: "blink 1s infinite",
      }}
    >
      {meetLink
        ? "You have already sent the Google Meet link"
        : "No link sent yet"}
    </p> */}
  </Modal.Body>
  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => {
        setShowLinkModal(false);
        setMeetLink("");
      }}
    >
      Cancel
    </Button>
  
    <Button
      variant="danger"
      onClick={handleDeleteLink}
      disabled={loadingLink || !provideLinkId}
    >
     Delete Link
    </Button>
    <Button
    variant="primary"
    onClick={() => {
      // ✅ Google Meet link validation
      const meetRegex = /^https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+$/;

      if (!meetRegex.test(meetLink.trim())) {
        toast.error(
          "Invalid Google Meet link! Please enter a valid link like https://meet.google.com/xxxxxxx"
        );
        return;
      }

      handleSubmitLink();
    }}
    disabled={loadingLink || !meetLink.trim()}
  >
    {loadingLink ? "Loading..." : "Send Link"}
  </Button>
  </Modal.Footer>

  {/* CSS for blink */}
  <style>
    {`
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
      }
    `}
  </style>
</Modal>
    </Container>
  );
}