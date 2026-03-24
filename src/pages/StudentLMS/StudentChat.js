import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";

const StudentChat = () => {
  const studentId = useSelector((state) => state.auth.id);
  const token = useSelector((state) => state.auth.token);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasAlert, setHasAlert] = useState(false);
  const messagesEndRef = useRef(null);
  const markedSeenRef = useRef(new Set());

  useEffect(() => {
    markedSeenRef.current = new Set();
  }, [studentId]);

  // Load previous messages from localStorage for this student
  useEffect(() => {
    if (!studentId) return;
    try {
      const stored = localStorage.getItem(`studentMessages_${studentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const limited =
          Array.isArray(parsed) && parsed.length > 100
            ? parsed.slice(parsed.length - 100)
            : parsed;
        setMessages(limited);
      }

      const storedAlert = localStorage.getItem(
        `studentMessagesAlert_${studentId}`
      );
      if (storedAlert === "true") {
        setHasAlert(true);
      }
    } catch (e) {
      console.error("Failed to load stored student messages", e);
    }
  }, [studentId]);

  // Load conversation from DB (preferred) on mount
  useEffect(() => {
    const loadFromDb = async () => {
      if (!studentId || !token) return;
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${studentId}?limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = res.data?.messages || [];
        // Merge with any messages that arrived via socket while DB was loading.
        setMessages((prev) => {
          const merged = [...prev, ...list];
          const seen = new Map();
          for (const m of merged) {
            if (m?._id) {
              seen.set(String(m._id), m);
            }
          }

          const deduped = Array.from(seen.values());
          // Keep chronological order
          deduped.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return deduped.slice(-100);
        });
        try {
          localStorage.setItem(
            `studentMessages_${studentId}`,
            JSON.stringify(list)
          );
        } catch (e) {}
      } catch (e) {
        // keep local cache if API fails
      }
    };
    loadFromDb();
  }, [studentId, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!studentId) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });
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
        const nextList = [...prev, msg];
        const limitedList =
          nextList.length > 100 ? nextList.slice(nextList.length - 100) : nextList;
        try {
          localStorage.setItem(
            `studentMessages_${studentId}`,
            JSON.stringify(limitedList)
          );
        } catch (e) {
          console.error("Failed to store student messages", e);
        }
        return limitedList;
      });
      // Tone for messages from admin
      if (msg.from === "admin") {
        playTone();
      }
    });

    // Seen status updates from admin
    s.on("message-seen-updated", ({ messages: updatedMessages }) => {
      if (!Array.isArray(updatedMessages) || updatedMessages.length === 0) return;

      setMessages((prev) => {
        const next = [...prev];
        updatedMessages.forEach((um) => {
          if (!um?._id) return;
          const idx = next.findIndex((m) => m?._id && String(m._id) === String(um._id));
          if (idx !== -1) next[idx] = { ...next[idx], ...um };
        });

        try {
          localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(next));
        } catch (e) {}

        return next;
      });
    });

    s.on("student-alert", (alert) => {
      // Mark persistent alert badge until user visits and closes
      setHasAlert(true);
      try {
        localStorage.setItem(
          `studentMessagesAlert_${studentId}`,
          "true"
        );
      } catch (e) {
        console.error("Failed to store student alert", e);
      }
    });

    s.on("student-message-sent", (msg) => {
      setMessages((prev) => {
        const nextList = [...prev, msg];
        const limitedList =
          nextList.length > 100 ? nextList.slice(nextList.length - 100) : nextList;
        try {
          localStorage.setItem(
            `studentMessages_${studentId}`,
            JSON.stringify(limitedList)
          );
        } catch (e) {
          console.error("Failed to store student messages", e);
        }
        return limitedList;
      });
    });

    return () => {
      s.disconnect();
    };
  }, [studentId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !input.trim() || !studentId) return;

    const text = input.trim();

    socket.emit("student-send-message", {
      studentId,
      message: text,
    });

    setInput("");
  };

  // Mark admin messages as seen when chat is open
  useEffect(() => {
    if (!socket || !studentId) return;

    const unseenIds = messages
      .filter((m) => m?.from === "admin" && !m?.seenByStudent && m?._id)
      .slice(-20)
      .map((m) => m._id)
      .filter((id) => !markedSeenRef.current.has(String(id)));

    if (unseenIds.length === 0) return;

    unseenIds.forEach((id) => markedSeenRef.current.add(String(id)));

    socket.emit("student-mark-seen", {
      studentId,
      messageIds: unseenIds,
    });

    // Optimistic update for instant ticks
    setMessages((prev) => {
      const nowIso = new Date().toISOString();
      const updated = prev.map((m) => {
        if (!m?._id) return m;
        const mid = String(m._id);
        if (unseenIds.some((id) => String(id) === mid)) {
          return { ...m, seenByStudent: true, seenAtStudent: nowIso };
        }
        return m;
      });
      try {
        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [socket, studentId, messages]);

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0 fw-semibold name_heading">Chat with Admin</h3>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={async () => {
                if (!studentId || !token) return;
                const ok = window.confirm(
                  "Are you sure you want to clear your chat history?"
                );
                if (!ok) return;

                setMessages([]);
                setHasAlert(false);
                markedSeenRef.current = new Set();
                try {
                  localStorage.removeItem(`studentMessages_${studentId}`);
                  localStorage.setItem(`studentMessagesAlert_${studentId}`, "false");
                } catch (e) {
                  console.error("Failed to clear student history", e);
                }

                try {
                  await axios.delete(
                    `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${studentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                } catch (e) {
                  // keep local clear even if API fails
                }
              }}
            >
              Clear History
            </Button>
          </div>
          {hasAlert && (
            <div
              className="alert alert-warning d-flex justify-content-between align-items-center py-2"
              style={{ borderRadius: 8 }}
            >
              <span>New message notification from Admin.</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setHasAlert(false);
                  try {
                    localStorage.setItem(
                      `studentMessagesAlert_${studentId}`,
                      "false"
                    );
                  } catch (e) {
                    console.error("Failed to clear student alert", e);
                  }
                }}
              >
                Clear
              </button>
            </div>
          )}
          <div
          style={{
            height: "auto",             // ✅ card ki fixed height
            overflowY: "auto",           // ✅ scroll enabled
            scrollBehavior: "smooth",    // smooth scrolling
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            background: "#fff",
            color: "rgb(172 181 192)",
          }}
        >
          {messages.slice(-10).map((m, i) => {
            const isMe = m.from === studentId;
            const deliveredToAdmin = !!m?.deliveredToAdmin;
            const seenByAdmin = !!m?.seenByAdmin;
            const ticks = seenByAdmin ? "✓✓" : deliveredToAdmin ? "✓" : "";
            return (
              <div 
                key={i}
                className="d-flex mb-2"
                style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    borderRadius: 16,
                    padding: "6px 12px",
                    backgroundColor: isMe ? "#0d6efd" : "#e9ecef",
                    color: isMe ? "#fff" : "#000",
                  }}
                >
                  <div style={{ fontSize: 14 }}>{m.message}</div>
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "right",
                      opacity: 0.7,
                    }}
                  >
                    {new Date(m.createdAt).toLocaleTimeString()}
                    {isMe && ticks && (
                      <span
                        style={{
                          marginLeft: 6,
                          color: seenByAdmin ? "#28a745" : "#dbeafe",
                          fontSize: 12,
                        }}
                      >
                        {ticks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        
          <div
            className="chat-end-space"
            style={{ color: "red" }}
            ref={messagesEndRef}
          />
          You can send a message below to chat with the admin.
        </div>
          <Form onSubmit={handleSend} className="d-flex gap-2 ">
            <Form.Control
            className="mt-3"
              placeholder="Type your message to admin..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" className="buttonColor mt-3">
              Send
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentChat;

