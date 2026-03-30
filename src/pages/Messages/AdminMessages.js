import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, ListGroup, Form, Button, Badge, Modal } from "react-bootstrap";
import { io } from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "./AdminMessages.css";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";

const AdminMessages = () => {
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

  // Initial load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminMessages");
      if (stored) setMessages(JSON.parse(stored));

      const storedUnread = localStorage.getItem("adminMessagesUnread");
      if (storedUnread) setUnread(JSON.parse(storedUnread));
    } catch (e) {
      console.error("Failed to parse stored admin messages", e);
    }
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
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {}
    };

    s.on("receive-message", (msg) => {
      const studentId = msg.from === "admin" ? msg.to : msg.from;

      setMessages((prev) => {
        const previousList = prev[studentId] || [];
        const nextList = [...previousList, msg].slice(-100);
        const updated = { ...prev, [studentId]: nextList };
        try { localStorage.setItem("adminMessages", JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      if (msg.from !== "admin") playTone();

      if (!activeStudent || activeStudent._id !== studentId) {
        setUnread((prev) => {
          const updated = { ...prev, [studentId]: (prev[studentId] || 0) + 1 };
          try { localStorage.setItem("adminMessagesUnread", JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    });

    s.on("message-seen-updated", ({ messages: updatedMessages }) => {
      if (!Array.isArray(updatedMessages)) return;
      setMessages((prev) => {
        const next = { ...prev };
        updatedMessages.forEach((um) => {
          if (!um?._id) return;
          const sid = um.from === "admin" ? um.to : um.from;
          if (next[sid]) {
            next[sid] = next[sid].map((m) =>
              String(m._id) === String(um._id) ? { ...m, ...um } : m
            );
          }
        });
        try { localStorage.setItem("adminMessages", JSON.stringify(next)); } catch (e) {}
        return next;
      });
    });

    return () => s.disconnect();
  }, [activeStudent]);

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const onlyStudents = (res.data.users || []).filter((u) => u.role !== "teacher");
        setStudents(onlyStudents);
      } catch (error) {
        toast.error("Failed to load students list");
      }
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
      try { localStorage.setItem("adminMessagesUnread", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Load from DB (only when activeStudent changes and it's not just cleared)
  useEffect(() => {
    const loadFromDb = async () => {
      if (!activeStudent?._id || !token) return;
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${activeStudent._id}?limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = res.data?.messages || [];

        setMessages((prev) => {
          const currentList = prev[activeStudent._id] || [];
          const merged = [...currentList, ...list];
          const seen = new Map(merged.map((m) => [String(m?._id), m]));
          const deduped = Array.from(seen.values())
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          const updated = { ...prev, [activeStudent._id]: deduped.slice(-100) };
          try { localStorage.setItem("adminMessages", JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      } catch (e) {
        console.error("DB load failed", e);
      }
    };
    loadFromDb();
  }, [activeStudent?._id, token]);

  const activeChatMessages = useMemo(() => 
    activeStudent ? messages[activeStudent._id] || [] : [], 
    [messages, activeStudent]
  );

  const displayedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    if (statusFilter === "active") return students.filter(s => onlineStudentIds.includes(String(s._id)));
    if (statusFilter === "inactive") return students.filter(s => !onlineStudentIds.includes(String(s._id)));
    return students;
  }, [students, onlineStudentIds, statusFilter]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChatMessages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !activeStudent || !input.trim()) return;

    socket.emit("admin-send-message", {
      studentId: activeStudent._id,
      message: input.trim(),
    });
    setInput("");
  };

  // Mark as seen
  useEffect(() => {
    if (!socket || !activeStudent?._id) return;
    const sid = String(activeStudent._id);

    const unseenIds = activeChatMessages
      .filter((m) => m?.from === sid && !m?.seenByAdmin && m?._id)
      .slice(-20)
      .map((m) => m._id);

    if (unseenIds.length === 0) return;

    setMessages((prev) => {
      const updated = { ...prev };
      const list = updated[sid] || [];
      updated[sid] = list.map((m) =>
        unseenIds.some((id) => String(id) === String(m._id))
          ? { ...m, seenByAdmin: true, seenAtAdmin: new Date().toISOString() }
          : m
      );
      try { localStorage.setItem("adminMessages", JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    socket.emit("admin-mark-seen", { studentId: sid, messageIds: unseenIds });
  }, [socket, activeStudent?._id, activeChatMessages]);

  // ====================== CLEAR HISTORY ======================
  const handleClearHistory = async () => {
    if (!activeStudent?._id || !token) return;

    const sid = activeStudent._id;

    // 1. Clear from state
    setMessages((prev) => {
      const updated = { ...prev };
      delete updated[sid];
      return updated;
    });

    // 2. Clear localStorage completely
    try {
      localStorage.removeItem(`studentMessages_${sid}`);
      localStorage.setItem(`studentMessagesAlert_${sid}`, "false");
      
      // Also remove from main admin storage
      const currentMessages = JSON.parse(localStorage.getItem("adminMessages") || "{}");
      delete currentMessages[sid];
      localStorage.setItem("adminMessages", JSON.stringify(currentMessages));
    } catch (e) {
      console.error("Local clear failed", e);
    }

    // 3. Clear from Database
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${sid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error("Server clear failed", e);
    }

    // 4. Close modal + small delay then reset activeStudent
    setShowClearModal(false);
    
    setTimeout(() => {
      setActiveStudent(null);        // Important: Reset so loadFromDb doesn't run again immediately
      toast.success(`Chat history with ${activeStudent.name} cleared successfully`);
    }, 300);
  };

  return (
    <Container fluid className="admin-messages-page py-3 px-3 px-md-4">
      <div className="admin-messages-shell">
        <aside className="admin-messages-sidebar">
          <div className="admin-messages-sidebar-header">
            <h2 className="admin-messages-sidebar-title">Students Messages</h2>
            <Form.Select
              size="sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-messages-filter"
            >
              <option value="all">All Students</option>
              <option value="active">🟢 Active (Online)</option>
              <option value="inactive">🔴 Unactive (Offline)</option>
            </Form.Select>
          </div>

          <div className="admin-messages-list-wrap">
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
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: onlineStudentIds.includes(String(s._id)) ? "#28a745" : "#dc3545",
                      }}
                    />
                    <span className="d-block min-w-0 text-truncate">
                      <span className="d-block text-truncate">{s.name}</span>
                      <small className="text-muted d-block text-truncate">{s.email}</small>
                    </span>
                  </span>

                  {unread[s._id] > 0 && (
                    <Badge bg="danger" className="blinking-alert flex-shrink-0">
                      {unread[s._id]}
                    </Badge>
                  )}
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
                  <small className="text-muted d-block d-md-inline ms-md-1">
                    ({activeStudent.email})
                  </small>
                </h2>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setShowClearModal(true)}
                >
                  Clear History
                </Button>
              </div>

              <div className="admin-messages-thread">
                {activeChatMessages.map((m, idx) => {
                  const isAdmin = m.from === "admin";
                  const deliveredToStudent = !!m?.deliveredToStudent;
                  const seenByStudent = !!m?.seenByStudent;
                  const ticks = seenByStudent ? "✓✓" : deliveredToStudent ? "✓" : "";

                  return (
                    <div
                      key={idx}
                      className={`admin-msg-row ${isAdmin ? "admin-msg-row--out" : "admin-msg-row--in"}`}
                    >
                      <div className={`admin-msg-bubble ${isAdmin ? "admin-msg-bubble--admin" : "admin-msg-bubble--student"}`}>
                        <div>{m.message}</div>
                        <div className="admin-msg-meta">
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isAdmin && ticks && (
                            <span className="admin-msg-ticks" style={{ color: seenByStudent ? "#28a745" : "black" }}>
                              {ticks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <Form onSubmit={handleSend} className="admin-messages-composer ">
                <div className="admin-messages-composer-inner ">
                  <Form.Control
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <Button type="submit" className="buttonColor">
                    Send
                  </Button>
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

      {/* Clear History Modal */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Clear Chat History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the entire chat history?<br />
          This action <strong>cannot be undone</strong>.
        </Modal.Body> 
    
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleClearHistory}>
            Yes, Clear History
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminMessages;