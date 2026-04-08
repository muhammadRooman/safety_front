import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { Container, Row, Col, Form, Button, Modal, Breadcrumb, Badge } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiSend, FiTrash2, FiChevronLeft, FiClock, FiCheck, FiCheckCircle } from "react-icons/fi";
import "./StudentChat.css";

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
          <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">
            {part}
          </a>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  useEffect(() => {
    markedSeenRef.current = new Set();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    try {
      const stored = localStorage.getItem(`studentMessages_${studentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(Array.isArray(parsed) ? parsed.slice(-100) : parsed);
      }
      if (localStorage.getItem(`studentMessagesAlert_${studentId}`) === "true") setHasAlert(true);
    } catch (e) { console.error(e); }
  }, [studentId]);

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
      } catch (e) { console.error(e); }
    };
    loadFromDb();
  }, [studentId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!studentId) return;
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);
    s.emit("join-student", { studentId });

    s.on("receive-message", (msg) => {
      setMessages((prev) => {
        const nextList = [...prev, msg].slice(-100);
        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(nextList));
        return nextList;
      });
      if (msg.from === "admin") {
         new Audio("/notification.mp3").play().catch(() => {});
      }
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
      prev.map(m => unseenIds.some(id => String(id) === String(m._id))
          ? { ...m, seenByStudent: true, seenAtStudent: new Date().toISOString() } : m
      )
    );
  }, [socket, studentId, messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !input.trim() || !studentId) return;
    socket.emit("student-send-message", { studentId, message: input.trim() });
    setInput("");
  };

  const handleClearHistory = async () => {
    if (!studentId || !token) return;
    setMessages([]);
    setHasAlert(false);
    markedSeenRef.current = new Set();
    localStorage.removeItem(`studentMessages_${studentId}`);
    localStorage.setItem(`studentMessagesAlert_${studentId}`, "false");
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { console.error(e); }
    setShowClearModal(false);
  };

  return (
    <Container fluid className="chat-page-wrapper">
      <div className="chat-container-main">
        {/* Header Section */}
      <header className="chat-top-bar d-flex justify-content-between align-items-center">
  
  {/* LEFT SIDE */}
  <div className="d-flex align-items-center">
    <Button 
      variant="link" 
      className="back-btn p-0 me-3" 
      onClick={() => navigate("/dashboard")}
    >
      <FiChevronLeft size={24} />
    </Button>

    <div>
      <h5 className="mb-0 fw-bold">Support Chat (Admin)</h5>
      <div className="admin-status">
        <span className="status-dot"></span>
        <small>Sir Farooq (CEO)</small>
      </div>
    </div>
  </div>

  {/* RIGHT SIDE DELETE BUTTON */}
  <Button 
    variant="link" 
    className="clear-btn text-danger p-0"
    onClick={() => setShowClearModal(true)}
  >
    <FiTrash2 size={20} />
  </Button>

</header>

        {/* Alert Section */}
        {hasAlert && (
          <div className="modern-alert shadow-sm">
            <span>Admin has sent you a new message</span>
            <button className="btn-close-alert" onClick={() => {
              setHasAlert(false);
              localStorage.setItem(`studentMessagesAlert_${studentId}`, "false");
            }}>Dismiss</button>
          </div>
        )}

        {/* Message Area */}
        <div className="message-area custom-scrollbar" style={{ backgroundImage: "url('/boss.png')" }}>
          <div className="message-list">
            {messages.map((m, i) => {
              const isMe = m.from === studentId;
              const delivered = !!m?.deliveredToAdmin;
              const seen = !!m?.seenByAdmin;

              return (
                <div key={i} className={`message-row ${isMe ? "me" : "admin"}`}>
                  <div className={`message-bubble shadow-sm ${isMe ? "bubble-me" : "bubble-admin"}`}>
                    <div className="content">{renderMessageWithLinks(m.message)}</div>
                    <div className="meta">
                      <FiClock size={10} className="me-1" />
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        <span className="status-ticks">
                          {seen ? <FiCheckCircle size={12} className="ms-1 text-success" /> : delivered ? <FiCheck size={12} className="ms-1" /> : null}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <footer className="chat-input-bar">
          <Form onSubmit={handleSend} className="input-form-wrapper">
            <Form.Control
              placeholder="Write a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="modern-input"
            />
            <Button type="submit" className="send-circle-btn" disabled={!input.trim()}>
              <FiSend size={20} />
            </Button>
          </Form>
        </footer>
      </div>

      {/* Clear Modal */}
      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered className="modern-modal">
        <Modal.Body className="text-center p-4">
          <div className="icon-circle mb-3"><FiTrash2 size={30} className="text-danger" /></div>
          <h4>Clear History?</h4>
          <p className="text-muted">This will permanently delete your conversation with admin.</p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" onClick={() => setShowClearModal(false)} className="px-4">Cancel</Button>
            <Button variant="danger" onClick={handleClearHistory} className="px-4">Delete </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default StudentChat;