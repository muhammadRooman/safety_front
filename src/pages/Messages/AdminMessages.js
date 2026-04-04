import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, ListGroup, Form, Button, Badge, Modal, Breadcrumb } from "react-bootstrap";
import { io } from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "./AdminMessages.css";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const AdminMessages = () => {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [socket, setSocket] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState({});
  const [onlineStudentIds, setOnlineStudentIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showClearModal, setShowClearModal] = useState(false);

  const messagesEndRef = useRef(null);

  const renderMessageWithLinks = (text) => {
    const raw = String(text || "");
    const parts = raw.split(URL_REGEX);
    return parts.map((part, idx) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a key={`${part}-${idx}`} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>;
    });
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminMessages");
      if (stored) setMessages(JSON.parse(stored));
      const storedUnread = localStorage.getItem("adminMessagesUnread");
      if (storedUnread) setUnread(JSON.parse(storedUnread));
    } catch (e) { console.error("Failed to parse stored admin messages", e); }
  }, []);

  // Socket Connection
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);
    s.emit("join-admin");

    s.on("online-students", ({ studentIds }) => {
      setOnlineStudentIds(Array.isArray(studentIds) ? studentIds.map(String) : []);
    });

    s.on("student-online", ({ studentId }) => {
      if (!studentId) return;
      const sid = String(studentId);
      setOnlineStudentIds((prev) => prev.includes(sid) ? prev : [...prev, sid]);
    });

    s.on("student-offline", ({ studentId }) => {
      if (!studentId) return;
      const sid = String(studentId);
      setOnlineStudentIds((prev) => prev.filter((id) => id !== sid));
    });

    const playTone = () => {
      try { new Audio("/notification.mp3").play().catch(() => {}); } catch {}
    };

    s.on("receive-message", (msg) => {
      const studentId = msg.from === "admin" ? msg.to : msg.from;

      // Update messages
      setMessages((prev) => {
        const previousList = prev[studentId] || [];
        const nextList = [...previousList, msg].slice(-100);
        const updated = { ...prev, [studentId]: nextList };
        try { localStorage.setItem("adminMessages", JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (msg.from !== "admin") playTone();

      // Update unread count
      if (!activeStudent || activeStudent._id !== studentId) {
        setUnread((prev) => {
          const updated = { ...prev, [studentId]: (prev[studentId] || 0) + 1 };
          try { localStorage.setItem("adminMessagesUnread", JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    });

    return () => s.disconnect();
  }, [activeStudent]);

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`, { headers: { Authorization: `Bearer ${token}` } });
        const onlyStudents = (res.data.users || []).filter(u => u.role !== "teacher");
        setStudents(onlyStudents);
      } catch { toast.error("Failed to load students list"); }
    };
    if (token) fetchStudents();
  }, [token]);

  // Auto-select student
  useEffect(() => {
    if (activeStudent || !students.length) return;
    const pick = students.find((s) => unread[String(s._id)] > 0) || students[0];
    if (pick) setActiveStudent(pick);
  }, [students, unread]);

  const handleSelectStudent = (student) => {
    setActiveStudent(student);
    setUnread((prev) => {
      const updated = { ...prev, [student._id]: 0 };
      try { localStorage.setItem("adminMessagesUnread", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const activeChatMessages = useMemo(() => activeStudent ? messages[activeStudent._id] || [] : [], [messages, activeStudent]);

  // Sort students: unread top
  const displayedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];

    const studentsWithUnread = students.map(s => ({
      ...s,
      unreadCount: unread[s._id] || 0
    }));

    let filtered = studentsWithUnread;
    if (statusFilter === "active") filtered = filtered.filter(s => onlineStudentIds.includes(String(s._id)));
    if (statusFilter === "inactive") filtered = filtered.filter(s => !onlineStudentIds.includes(String(s._id)));

    // Sort descending unread count
    filtered.sort((a, b) => b.unreadCount - a.unreadCount);

    return filtered;
  }, [students, onlineStudentIds, statusFilter, unread]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [activeChatMessages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !activeStudent || !input.trim()) return;
    socket.emit("admin-send-message", { studentId: activeStudent._id, message: input.trim() });
    setInput("");
  };

  return (
    <Container fluid className="admin-messages-page py-3 px-3 px-md-4" >
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/dashboard/messages")}>Messages</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="fw-bold mb-1 mb-0 fw-semibold name_heading">Messages</h3>
      <div className="admin-messages-shell">
        <aside className="admin-messages-sidebar">
          <div className="admin-messages-sidebar-header" >
            <h2 className="admin-messages-sidebar-title">Students Messages</h2>
            <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-messages-filter">
              <option value="all">All Students</option>
              <option value="active">🟢 Active (Online)</option>
              <option value="inactive">🔴 Unactive (Offline)</option>
            </Form.Select>
          </div>

          <div className="admin-messages-list-wrap" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <ListGroup className="admin-messages-list">
              {displayedStudents.map((s) => (
                <ListGroup.Item
                  key={s._id}
                  action
                  active={activeStudent && activeStudent._id === s._id}
                  onClick={() => handleSelectStudent(s)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span className="d-flex align-items-center gap-2 min-w-0">
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: onlineStudentIds.includes(String(s._id)) ? "#28a745" : "#dc3545" }} />
                    <span className="d-block min-w-0 text-truncate">
                      <span className="d-block text-truncate">{s.name}</span>
                      <small className="text-muted d-block text-truncate">{s.email}</small>
                    </span>
                  </span>
                  {unread[s._id] > 0 && <Badge bg="danger" className="blinking-alert flex-shrink-0">{unread[s._id]}</Badge>}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </aside>

        <section className="admin-messages-main">
          {activeStudent ? (
            <>
              <div className="admin-messages-chat-header">
                <h2 className="admin-messages-chat-title">
                  Chat with {activeStudent.name}
                  <small className="text-muted d-block d-md-inline ms-md-1">({activeStudent.email})</small>
                </h2>
              </div>

              <div
  className="admin-messages-thread"
  style={{
    backgroundImage: "url('/msg1.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  
    overflowY: "auto"
  }}
>
  {activeChatMessages.map((m, idx) => {
    const isAdmin = m.from === "admin";
    return (
      <div key={idx} className={`admin-msg-row ${isAdmin ? "admin-msg-row--out" : "admin-msg-row--in"}`}>
        <div className={`admin-msg-bubble ${isAdmin ? "admin-msg-bubble--admin" : "admin-msg-bubble--student"}`}>
          <div>{renderMessageWithLinks(m.message)}</div>
          <div className="admin-msg-meta">
            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    );
  })}
  <div ref={messagesEndRef} />
</div>

              <Form onSubmit={handleSend} className="admin-messages-composer ">
                <div className="admin-messages-composer-inner ">
                  <Form.Control placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} />
                  <Button type="submit" className="buttonColor">Send</Button>
                </div>
              </Form>
            </>
          ) : (
            <div className="admin-messages-empty">
              <p className="text-muted mb-0">Select a student from the left list to start chat.</p>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
};

export default AdminMessages;