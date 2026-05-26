import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [y, m, d] = dateValue.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const parseAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    if (!cleaned) return NaN;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

const getNumericValue = (...values) => {
  for (const v of values) {
    const n = parseAmount(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const getPositiveNumericValue = (...values) => {
  for (const v of values) {
    const n = parseAmount(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
};

export default function AdminAccounts() {
  const token = useSelector((state) => state.auth.token);
  const API_BASE = process.env.REACT_APP_BASE_ADMIN_API;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(monthKey());
  const [summary, setSummary] = useState(null);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const [showTotalModal, setShowTotalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const paymentAmountRef = useRef(null);

  const [totalFeeInput, setTotalFeeInput] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentDateInput, setPaymentDateInput] = useState("");
  const [currentPaidAmount, setCurrentPaidAmount] = useState(0);
  const [savingStudentVideoMap, setSavingStudentVideoMap] = useState({});
  const [savingStudentAccountMap, setSavingStudentAccountMap] = useState({});

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const branches = useMemo(() => {
    const unique = [...new Set(rows.map(r => r.branch).filter(Boolean))];
    return unique.sort();
  }, [rows]);

  const loadVideoSetting = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/settings/video`, { 
        headers, showGlobalLoader: false 
      });
      setVideoEnabled(res.data?.enabled !== false);
    } catch (e) {}
  };

  const loadSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/fees/summary`, {
        headers,
        params: { month, _t: Date.now() },
        cache: false,
        showGlobalLoader: false,
      });
      setSummary(res.data || null);
    } catch (e) {
      setSummary(null);
    }
  };

  const loadRows = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/fees/students`, {
        headers,
        params: { month, _t: Date.now() },
        cache: false,
        showGlobalLoader: false,
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      setRows([]);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRows(), loadSummary(), loadVideoSetting()]);
    } catch (e) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) refreshAll();
  }, [token, month]);

  const totalRefund = useMemo(() => {
    return rows.reduce((sum, student) => {
      const remaining = (student.totalFee || 0) - (student.paidTotal || 0);
      return remaining < 0 ? sum + Math.abs(remaining) : sum;
    }, 0);
  }, [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (selectedBranch) {
      result = result.filter(r => r.branch === selectedBranch);
    }
    const s = search.trim().toLowerCase();
    if (s) {
      result = result.filter((r) =>
        String(r.name || "").toLowerCase().includes(s) ||
        String(r.email || "").toLowerCase().includes(s) ||
        String(r.phone || "").toLowerCase().includes(s) ||
        String(r.branch || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [rows, search, selectedBranch]);

  const calculateRemaining = (totalFee = 0, paidTotal = 0) => totalFee - paidTotal;

  // Open Total Fee Modal
  const openTotalModal = (student) => {
    if (!student) return;
    setActiveStudent(student);
    setTotalFeeInput(student?.totalFee != null ? String(student.totalFee) : "");
    setShowTotalModal(true);
  };

  // Open Payment Modal (Fixed)
  const openPaymentModal = (student) => {
    if (!student) return;
    setActiveStudent(student);
    const calculatedPending =
      getNumericValue(student?.totalFee) - getNumericValue(student?.paidTotal);
    const lastPaymentAmount = getPositiveNumericValue(
      student?.lastPaymentAmount,
      student?.lastPaidAmount,
      student?.latestPayment,
      student?.previousPayment,
      student?.lastPayment
    );
    const pendingAmount = getPositiveNumericValue(
      student?.pending,
      student?.pendingFee,
      student?.pendingAmount,
      student?.pendingFees,
      student?.pending_fee,
      student?.pending_amount,
      student?.remaining,
      student?.remainingFee,
      student?.remainingAmount,
      student?.due,
      student?.dueFee,
      student?.dueAmount,
      student?.balance,
      student?.outstanding,
      calculatedPending
    );
    const paidSoFar = getNumericValue(student?.paidTotal, student?.paidThisMonth);
    const defaultAmount = getPositiveNumericValue(
      paidSoFar,
      lastPaymentAmount,
      pendingAmount
    );
    const paidAmountFallback = getPositiveNumericValue(
      student?.paidThisMonth,
      student?.paidAmount,
      student?.paid,
      student?.paidTotal
    );
    const finalDefaultAmount = getPositiveNumericValue(
      defaultAmount,
      paidAmountFallback,
      student?.totalFee
    );
    setCurrentPaidAmount(paidSoFar);
    setPaymentAmountInput(finalDefaultAmount > 0 ? String(finalDefaultAmount) : "");
    setPaymentDateInput(new Date().toISOString().split("T")[0]); // Aaj ki date
    setShowPaymentModal(true);
  };

  useEffect(() => {
    if (!showPaymentModal) return;
    const timer = setTimeout(() => {
      paymentAmountRef.current?.focus();
      paymentAmountRef.current?.select();
    }, 0);
    return () => clearTimeout(timer);
  }, [showPaymentModal, activeStudent]);

  // Save Total Fee
  const saveTotalFee = async () => {
    const studentId = activeStudent?.studentId || activeStudent?._id || activeStudent?.id;
    if (!studentId) return;
    const newTotal = Number(totalFeeInput);
    if (!Number.isFinite(newTotal) || newTotal < 0) {
      toast.error("Total fee must be >= 0");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/admin/fees/student/${studentId}/total`,
        { totalFee: newTotal },
        { headers }
      );
      toast.success("Total fee updated successfully");
      setShowTotalModal(false);
      setTimeout(() => setActiveStudent(null), 300);
      await refreshAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update total fee");
    }
  };

  // Add Payment
  const addPayment = async () => {
    const studentId = activeStudent?.studentId || activeStudent?._id || activeStudent?.id;
    if (!studentId) return;

    const amount = getNumericValue(paymentAmountInput);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Amount must be 0 or greater");
      return;
    }

    const amountToAdd = amount - currentPaidAmount;
    if (amountToAdd === 0) {
      toast.info("No change in paid amount");
      setShowPaymentModal(false);
      return;
    }

    const paymentDate = paymentDateInput || new Date().toISOString().slice(0, 10);
    const paidAt = `${paymentDate}T00:00:00.000Z`;

    try {
      const payloads = [
        { studentId, amount: amountToAdd, paidAt, paymentDate },
        { studentId, amount: amountToAdd, paymentDate },
        { studentId, paymentAmount: amountToAdd, paidAt, paymentDate },
        { studentId, paymentAmount: amountToAdd, paymentDate },
      ];

      let saved = false;
      let lastError = null;

      for (const payload of payloads) {
        try {
          const res = await axios.post(`${API_BASE}/admin/fees/payment`, payload, { headers });
          if (res?.data?.success === false) {
            throw new Error(res?.data?.message || "Payment rejected by server");
          }
          saved = true;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!saved) {
        throw lastError || new Error("Failed to add payment");
      }

      setRows((prev) =>
        prev.map((row) => {
          const rowId = row?.studentId || row?._id || row?.id;
          if (String(rowId) !== String(studentId)) return row;

          const nextPaidTotal = getNumericValue(row?.paidTotal) + amountToAdd;
          const nextPaidThisMonth = getNumericValue(row?.paidThisMonth) + amountToAdd;
          const nextTotalFee = getNumericValue(row?.totalFee);
          return {
            ...row,
            paidTotal: nextPaidTotal,
            paidThisMonth: nextPaidThisMonth,
            pending: Math.max(0, nextTotalFee - nextPaidTotal),
            lastPaidAt: paidAt,
            paymentDate: paymentDate,
          };
        })
      );

      toast.success("Paid amount updated successfully");
      setShowPaymentModal(false);
      setTimeout(() => setActiveStudent(null), 300);
      await refreshAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update paid amount");
    }
  };

  const toggleVideo = async () => {
    try {
      setSavingVideo(true);
      const next = !videoEnabled;
      await axios.put(`${API_BASE}/admin/settings/video`, { enabled: next }, { headers });
      setVideoEnabled(next);
      toast.success(next ? "Video Enabled" : "Video Disabled");
    } catch (e) {
      toast.error("Failed to update video setting");
    } finally {
      setSavingVideo(false);
    }
  };

  const toggleStudentVideoAccess = async (student) => {
    const studentId = student?.studentId || student?._id || student?.id;
    if (!studentId) return;
    const nextEnabled = !(student?.videoAccessEnabled !== false);

    setSavingStudentVideoMap((prev) => ({ ...prev, [String(studentId)]: true }));
    try {
      await axios.put(
        `${API_BASE}/admin/fees/student/${studentId}/video-access`,
        { enabled: nextEnabled },
        { headers }
      );
      setRows((prev) =>
        prev.map((row) => {
          const rowId = row?.studentId || row?._id || row?.id;
          if (String(rowId) !== String(studentId)) return row;
          return { ...row, videoAccessEnabled: nextEnabled };
        })
      );
      toast.success(nextEnabled ? "Student video enabled" : "Student video disabled");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update student video status");
    } finally {
      setSavingStudentVideoMap((prev) => ({ ...prev, [String(studentId)]: false }));
    }
  };

  const toggleStudentAccountStatus = async (student) => {
    const studentId = student?.studentId || student?._id || student?.id;
    if (!studentId) return;
    const nextEnabled = !(student?.accountEnabled !== false);

    setSavingStudentAccountMap((prev) => ({ ...prev, [String(studentId)]: true }));
    try {
      await axios.put(
        `${API_BASE}/admin/fees/student/${studentId}/account-status`,
        { enabled: nextEnabled },
        { headers }
      );
      setRows((prev) =>
        prev.map((row) => {
          const rowId = row?.studentId || row?._id || row?.id;
          if (String(rowId) !== String(studentId)) return row;
          return { ...row, accountEnabled: nextEnabled };
        })
      );
      toast.success(nextEnabled ? "Student account enabled" : "Student account disabled");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update student account status");
    } finally {
      setSavingStudentAccountMap((prev) => ({ ...prev, [String(studentId)]: false }));
    }
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Fee Accounts</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Fee Management</h2>
          <p className="text-muted mb-0">Manage student fees, payments & refunds</p>
        </div>
        <Button variant="outline-primary" onClick={refreshAll}>
          <i className="bi bi-arrow-clockwise me-2"></i>Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-muted small">This Month Revenue</div>
              <h3 className="mb-0 fw-bold text-success">
                {summary?.monthRevenue != null ? `Rs. ${summary.monthRevenue}` : "—"}
              </h3>
              <Form.Control
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="mt-3"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-muted small">Total Pending</div>
              <h3 className="mb-0 fw-bold text-warning">
                {summary?.totalPending != null ? `Rs. ${summary.totalPending}` : "—"}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-muted small">Total Refund</div>
              <h3 className="mb-0 fw-bold text-danger">
                {totalRefund > 0 ? `Rs. ${totalRefund}` : "—"}
              </h3>
            </Card.Body>
          </Card>
        </Col>

       
      </Row>

      {/* Filters */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Label className="small fw-medium">Search Student</Form.Label>
              <Form.Control
                placeholder="Name, Email, Phone or Branch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-medium">Filter by Branch</Form.Label>
              <Form.Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="text-md-end">
              <div className="text-muted small">
                Showing: <strong>{filteredRows.length}</strong> students
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading student accounts...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Student Name</th>
                    <th>Assigned Courses</th>
                    <th>Branch</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th className="text-end">Total Fee</th>
                    <th className="text-end">Paid</th>
                    <th className="text-center">Pending</th>
                    <th className="text-center">Refund</th>
                    <th>Payment Date</th>
                    <th className="text-center">Video Status</th>
                    <th className="text-center">Account</th>
                    <th style={{ width: 210 }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => {
                    const remaining = calculateRemaining(r.totalFee, r.paidTotal);
                    const isOverpaid = remaining < 0;

                    return (
                      <tr key={String(r.studentId)}>
                        <td className="fw-semibold">{r.name || "—"}</td>
                        <td className="small">
  {Array.isArray(r.assignedCourses) && r.assignedCourses.length > 0 ? (
    r.assignedCourses.map((course, index) => (
      <span
        key={index}
        className="badge bg-primary me-1"
        style={{ fontSize: "0.75rem" }}
      >
        {course}
      </span>
    ))
  ) : (
    "—"
  )}
</td>
                        <td>{r.branch || "—"}</td>
                        <td className="small">{r.phone || "—"}</td>
                        <td className="small text-muted">{r.email || "—"}</td>
                        <td className="text-end fw-semibold">Rs. {r.totalFee ?? "—"}</td>
                        <td className="text-end fw-medium">Rs. {r.paidTotal ?? "—"}</td>

                        <td className="text-center">
                          {r.pending > 0 ? (
                            <Badge bg="warning" text="dark">Rs. {r.pending}</Badge>
                          ) : (
                            <Badge bg="success">Paid</Badge>
                          )}
                        </td>

                        <td className="text-center">
                          {isOverpaid ? (
                            <Badge bg="danger">Rs. {Math.abs(remaining)} Refund</Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                       
                        <td className="small text-nowrap">
                          {formatDate(r.paymentDate || r.lastPaidAt || r.lastPaymentDate || r.paidAt || r.createdAt)}
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {r.videoAccessEnabled !== false ? (
                              <Badge bg="success">ON</Badge>
                            ) : (
                              <Badge bg="danger">OFF</Badge>
                            )}
                            <Form.Check
                              type="switch"
                              id={`video-access-${String(r.studentId)}`}
                              checked={r.videoAccessEnabled !== false}
                              disabled={!!savingStudentVideoMap[String(r.studentId)]}
                              onChange={() => toggleStudentVideoAccess(r)}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {r.accountEnabled !== false ? (
                              <Badge bg="success">ON</Badge>
                            ) : (
                              <Badge bg="danger">OFF</Badge>
                            )}
                            <Form.Check
                              type="switch"
                              id={`account-status-${String(r.studentId)}`}
                              checked={r.accountEnabled !== false}
                              disabled={!!savingStudentAccountMap[String(r.studentId)]}
                              onChange={() => toggleStudentAccountStatus(r)}
                            />
                          </div>
                        </td>

                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Button size="sm" variant="outline-primary" onClick={() => openTotalModal(r)}>
                              Total
                            </Button>
                            <Button size="sm" variant="success" onClick={() => openPaymentModal(r)}>
                              Pay
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={14} className="text-center py-5 text-muted">
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ====================== ADD PAYMENT MODAL ====================== */}
     {/* ====================== PROFESSIONAL PAYMENT MODAL ====================== */}
<Modal 
  show={showPaymentModal} 
  onHide={() => setShowPaymentModal(false)} 
  centered
>
  <Modal.Header closeButton className="border-0">
    <Modal.Title className="d-flex align-items-center">
      <i className="bi bi-credit-card-2-front fs-3 text-success me-3"></i>
      Add Payment
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {activeStudent && (
      <div className="mb-4 p-4 bg-light rounded-3 border">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
            <i className="bi bi-person-fill fs-3 text-primary"></i>
          </div>
          <div>
            <h5 className="mb-1 fw-semibold">Name: {activeStudent.name}</h5>
          </div>
        </div>

        {/* Email with Icon */}
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-envelope-fill text-muted me-3 fs-5" style={{ width: "20px" }}></i>
          <span className="text-muted">Email: {activeStudent.email || "—"}</span>
        </div>

        {/* Branch with Icon */}
        <div className="d-flex align-items-center">
          <i className="bi bi-geo-alt-fill text-muted me-3 fs-5" style={{ width: "20px" }}></i>
          <span className="text-muted">Branch: {activeStudent.branch || "No Branch"}</span>
        </div>
      </div>
    )}

    <Row className="g-4">
      <Col md={12}>
        <div className="small text-muted mb-1">
          Current Paid: <strong>Rs. {currentPaidAmount || 0}</strong>
        </div>
      </Col>

      <Col md={6}>
        <Form.Label className="fw-medium">Payment Amount (Rs.) <span className="text-danger">*</span></Form.Label>
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-currency-rupee"></i>
          </span>
          <Form.Control
            ref={paymentAmountRef}
            type="number"
            min="0"
            step="1"
            value={paymentAmountInput}
            onChange={(e) => setPaymentAmountInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Enter amount"
            className="ps-2"
          />
        </div>
      </Col>

      <Col md={6}>
        <Form.Label className="fw-medium">Payment Date</Form.Label>
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-calendar3"></i>
          </span>
          <Form.Control
            type="date"
            value={paymentDateInput}
            onChange={(e) => setPaymentDateInput(e.target.value)}
          />
        </div>
      </Col>
    </Row>
  </Modal.Body>

  <Modal.Footer className="border-0">
    <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
      Cancel
    </Button>
    <Button variant="success" onClick={addPayment}>
      <i className="bi bi-check-lg me-2"></i>
      Add Payment
    </Button>
  </Modal.Footer>
</Modal>

      {/* Set Total Fee Modal */}
     {/* ====================== SET TOTAL FEE MODAL ====================== */}
<Modal 
  show={showTotalModal} 
  onHide={() => setShowTotalModal(false)} 
  centered
>
  <Modal.Header closeButton className="border-0">
    <Modal.Title className="d-flex align-items-center">
      <i className="bi bi-coin fs-3 text-warning me-3"></i>
      Set Total Fee
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {activeStudent && (
      <div className="mb-4 p-4 bg-light rounded-3 border">
        <div className="d-flex align-items-center mb-3">
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
            <i className="bi bi-person-fill fs-3 text-primary"></i>
          </div>
          <div>
            <h5 className="mb-1 fw-semibold">Name: {activeStudent.name}</h5>
          </div>
        </div>

        {/* Email with Icon */}
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-envelope-fill text-muted me-3 fs-5" style={{ width: "22px" }}></i>
          <span className="text-muted">Email: {activeStudent.email || "—"}</span>
        </div>

        {/* Branch with Icon */}
        <div className="d-flex align-items-center">
          <i className="bi bi-geo-alt-fill text-muted me-3 fs-5" style={{ width: "22px" }}></i>
          <span className="text-muted">Branch: {activeStudent.branch || "No Branch"}</span>
        </div>
      </div>
    )}

    <Form.Group>
      <Form.Label className="fw-medium text-muted small mb-2">
        TOTAL FEE AMOUNT (Rs.)
      </Form.Label>
      <div className="input-group input-group-lg">
        <span className="input-group-text bg-white">
          <i className="bi bi-currency-rupee fs-4 text-success"></i>
        </span>
        <Form.Control
          type="number"
          min="0"
          step="1"
          value={totalFeeInput}
          onChange={(e) => setTotalFeeInput(e.target.value)}
          placeholder="Enter total fee"
          className="border-start-0 fw-semibold"
        />
      </div>
    </Form.Group>
  </Modal.Body>

  <Modal.Footer className="border-0 pt-2">
    <Button variant="light" onClick={() => setShowTotalModal(false)} className="px-4">
      Cancel
    </Button>
    <Button variant="primary" onClick={saveTotalFee} className="px-5">
      <i className="bi bi-check2-circle me-2"></i>
      Save Total Fee
    </Button>
  </Modal.Footer>
</Modal>
    </Container>
  );
}