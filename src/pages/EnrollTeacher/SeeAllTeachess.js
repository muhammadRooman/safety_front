import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoMdAdd } from "react-icons/io";
import DataTable from "react-data-table-component";
import axios from "axios";
import { FaDownload } from "react-icons/fa";
import { ENV } from "../../config/config";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { CSVLink } from "react-csv";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Button, Breadcrumb, Card, Container, Row, Col, Form, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
export default function SeeAllTeachess() {
  const { t } = useTranslation();
 
  const token = useSelector((state) => state.auth.token);

  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [filterText, setFilterText] = useState("");
 
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState("");

  const Columns = () => [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      sortable: false,
      width: "70px",
      center: true,
    },
    { name: t("name"), selector: (row) => row.name, sortable: true },
    { name: t("email"), selector: (row) => row.email, sortable: true },
    { name: t("phone"), selector: (row) => row.phone, sortable: true },
    { name: t("Location"), selector: (row) => row.location, sortable: true },
   
    {
  name: "salary",
  selector: (row) => row.salary ? row.salary : "NA",
  sortable: true
},
 {
  name: t("Trainer"),
  cell: (row) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
      {row.subject?.map((sub, index) => (
        <span
          key={index}
          style={{
    padding: "5px 10px",
    backgroundColor: "rgba(62, 100, 171, 0.8)", // Changed to blue
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  }}
        >
          {sub}
        </span>
      ))}
    </div>
  ),
  sortable: true,
}
,

    {
      name: t("image"),
      cell: (row) => (
        <img
          src={`${process.env.REACT_APP_BASE_uploads}/${row.image}`}
          alt={row.name}
          style={{ width: "50px", height: "50px", borderRadius: "4px", objectFit: "cover" }}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  {
  name: t("action") || "Action",
  cell: (row) => (
    <div className="d-flex gap-2">
      
      <OverlayTrigger placement="top"   overlay={<Tooltip>Edit Teacher</Tooltip>}>
        <Button size="sm" variant="success" onClick={() => handleEdit(row)}>
          <MdEdit size={22} />
        </Button>
      </OverlayTrigger>

      <OverlayTrigger placement="top"   overlay={<Tooltip>Delete Teacher</Tooltip>}>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
          <MdDelete size={22} />
        </Button>
      </OverlayTrigger>

    </div>
  ),
}
  ];

  const columns = Columns();

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(`${ENV.appBaseUrl}/admin/enrollTeacher`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response) {
        setBlogs(response.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("errorFetchingData"));
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredItems = blogs.filter((item) =>
    item.name?.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleEdit = (row) => {
    navigate(`/dashboard/teacher_enroll/${row._id}`);
  };

  const handleDelete = (row) => {
    setDelId(row._id);
    setOpen(true);
  };

  const DeleteBlog = async () => {
    try {
      const response = await axios.delete(
        `${ENV.appBaseUrl}/admin/enrollTeacher/${delId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Teacher deleted");
      fetchBlogs();
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t("deleteError"));
    }
  };

  const csvHeaders = [
    { label: t("name"), key: "name" },
    { label: t("email"), key: "email" },
    { label: t("phone"), key: "phone" },
    { label: t("salary"), key: "salary" },
    { label: t("location"), key: "location" },
    { label: t("trainer"), key: "subject" },
  ];

  const csvData = blogs.map((item) => ({
    name: item.name,
    email: item.email,
    phone: item.phone,
    salary: item.salary,
    location: item.location,
    subject: item.subject,
  }));

  return (
    <Container className="py-4">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>
          {t("dashboard")}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{t("allTeachers")}</Breadcrumb.Item>
      </Breadcrumb>

      

      {/* Header */}
      <Row className="mb-4 align-items-center justify-content-between">
        <Col xs={12} md="auto" className="mb-2 mb-md-0">
          <h3 className=" mb-0 fw-semibold name_heading">{t("teacherList")}</h3>
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
      filename="teacher_records.csv"
      className="btn csv px-3"
    >
      <FaDownload /> Export <span className="d-none d-sm-inline"></span>
    </CSVLink>
  )}

  <Button
    className="buttonColor px-3 d-flex align-items-center"
    onClick={() => navigate("/dashboard/teacher_enroll/create")}
  >
    <IoMdAdd size={25} />Add Teacher
    <span className="ms-1 d-none d-sm-inline">Add</span>
  </Button>
</Col>
      </Row>

      {/* Search */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder={t("searchByName")}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Card.Body>
          <div className="datatable-scroll-wrapper">
            <DataTable
              columns={columns}
              data={filteredItems}
              pagination
             
              highlightOnHover
              pointerOnHover
              responsive
              striped
            />
          </div>
        </Card.Body>
      </Card>

      {/* Delete Modal */}
      <Modal show={open} onHide={() => setOpen(false)} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>{t("deleteConfirmation")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t("deletePrompt")}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={DeleteBlog}>
            {t("yesDelete")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
