import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { Container, Row, Col, Form, Button, Modal, Breadcrumb } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const StudentChat = () => {
  const studentId = useSelector((state) => state.auth.id);
  const token = useSelector((state) => state.auth.token);

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasAlert, setHasAlert] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const markedSeenRef = useRef(new Set());

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

  useEffect(() => {
    markedSeenRef.current = new Set();
  }, [studentId]);

  // Load from localStorage
  useEffect(() => {
    if (!studentId) return;
    try {
      const stored = localStorage.getItem(`studentMessages_${studentId}`);
      console.log("sss")
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(Array.isArray(parsed) && parsed.length > 100 
          ? parsed.slice(-100) 
          : parsed);
      }

      if (localStorage.getItem(`studentMessagesAlert_${studentId}`) === "true") {
        setHasAlert(true);
      }
    } catch (e) {
      console.error("Failed to load stored messages", e);
    }
  }, [studentId]);

  // Load from Database
  useEffect(() => {
    const loadFromDb = async () => {
      if (!studentId || !token) return;
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${studentId}?limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const list = res.data?.messages || [];
        setMessages((prev) => {
          const merged = [...prev, ...list];
          const seen = new Map(merged.map(m => [String(m._id), m]));
          const deduped = Array.from(seen.values());
          deduped.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return deduped.slice(-100);
        });

        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(list));
      } catch (e) {
        console.error("Failed to load messages from DB", e);
      }
    };
    loadFromDb();
  }, [studentId, token]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Socket Connection
  useEffect(() => {
    if (!studentId) return;

    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);
    s.emit("join-student", { studentId });

    const playTone = () => {
      try {
        const audio = new Audio("/notification.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {}
    };

    s.on("receive-message", (msg) => {
      setMessages((prev) => {
        const nextList = [...prev, msg].slice(-100);
        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(nextList));
        return nextList;
      });
      if (msg.from === "admin") playTone();
    });

    s.on("message-seen-updated", ({ messages: updatedMessages }) => {
      if (!Array.isArray(updatedMessages)) return;
      setMessages((prev) => {
        const next = [...prev];
        updatedMessages.forEach(um => {
          const idx = next.findIndex(m => String(m._id) === String(um._id));
          if (idx !== -1) next[idx] = { ...next[idx], ...um };
        });
        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(next));
        return next;
      });
    });

    s.on("student-alert", () => {
      setHasAlert(true);
      localStorage.setItem(`studentMessagesAlert_${studentId}`, "true");
    });

    s.on("student-message-sent", (msg) => {
      setMessages((prev) => {
        const nextList = [...prev, msg].slice(-100);
        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(nextList));
        return nextList;
      });
    });

    return () => s.disconnect();
  }, [studentId]);

  // Mark messages as seen
  useEffect(() => {
    if (!socket || !studentId) return;

    const unseenIds = messages
      .filter(m => m?.from === "admin" && !m?.seenByStudent && m?._id)
      .slice(-20)
      .map(m => m._id)
      .filter(id => !markedSeenRef.current.has(String(id)));

    if (unseenIds.length === 0) return;

    unseenIds.forEach(id => markedSeenRef.current.add(String(id)));

    socket.emit("student-mark-seen", { studentId, messageIds: unseenIds });

    setMessages(prev =>
      prev.map(m =>
        unseenIds.some(id => String(id) === String(m._id))
          ? { ...m, seenByStudent: true, seenAtStudent: new Date().toISOString() }
          : m
      )
    );
  }, [socket, studentId, messages]);

  // ====================== HANDLE SEND ======================
  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !input.trim() || !studentId) return;

    socket.emit("student-send-message", {
      studentId,
      message: input.trim(),
    });

    setInput("");
  };

  // ====================== CLEAR HISTORY ======================
  const handleClearHistory = async () => {
    if (!studentId || !token) return;

    setMessages([]);
    setHasAlert(false);
    markedSeenRef.current = new Set();

    try {
      localStorage.removeItem(`studentMessages_${studentId}`);
      localStorage.setItem(`studentMessagesAlert_${studentId}`, "false");
    } catch (e) {
      console.error(e);
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error("Server clear failed", e);
    }

    setShowClearModal(false);
  };

  return (
    <Container className="py-4">
    <Breadcrumb>
    <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
    <Breadcrumb.Item onClick={() => navigate("/dashboard/student-chat")}>Messages</Breadcrumb.Item>
  </Breadcrumb>

  <h3 className="fw-bold mb-1 mb-0 fw-semibold name_heading">Chat with Admin</h3>
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0 fw-semibold name_heading">Sir Farooq (CEO)</h3>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setShowClearModal(true)}
            >
              Clear History
            </Button>
          </div>

          {hasAlert && (
            <div className="alert alert-warning d-flex justify-content-between align-items-center py-2 mb-3" style={{ borderRadius: 8 }}>
              <span>New message notification from Admin.</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setHasAlert(false);
                  localStorage.setItem(`studentMessagesAlert_${studentId}`, "false");
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Chat Box */}
          <div
            style={{
              height: "400px",
              overflowY: "auto",
              scrollBehavior: "smooth",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              backgroundImage: "url('/boss.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            }}
          >
            {messages.slice(-10).map((m, i) => {
              const isMe = m.from === studentId;
              const deliveredToAdmin = !!m?.deliveredToAdmin;
              const seenByAdmin = !!m?.seenByAdmin;
              const ticks = seenByAdmin ? "✓✓" : deliveredToAdmin ? "✓" : "";

              return (
                <div key={i} className="d-flex mb-3" style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "75%",
                      borderRadius: "16px",
                      padding: "10px 14px",
                      backgroundColor: isMe ? "rgb(255, 204, 42)" : "#e9ecef",
                      color: "#000",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ fontSize: "15px", wordBreak: "break-word" }}>
                      {renderMessageWithLinks(m.message)}
                    </div>
                    <div style={{ fontSize: "11px", textAlign: "right", marginTop: "4px", opacity: 0.75 }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}

                      {isMe && ticks && (
                        <span style={{ marginLeft: "6px", color: seenByAdmin ? "#28a745" : "#555" }}>
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

          {/* Input Form */}
         <div
  style={{
    background: "#ffffff",
    borderRadius: "15px",
    padding: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  }}
>
  <Form onSubmit={handleSend} className="d-flex gap-2">
    <Form.Control
      placeholder="Type your message to admin..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      style={{
        borderRadius: "10px",
      }}
    />
    <Button type="submit" className="buttonColor">
      Send
    </Button>
  </Form>
</div>
        </Col>
      </Row>

      {/* Clear History Confirmation Modal */}
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

export default StudentChat;