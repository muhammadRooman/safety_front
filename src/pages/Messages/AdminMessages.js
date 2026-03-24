import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Row, Col, ListGroup, Form, Button, Badge, Card } from "react-bootstrap";
import { io } from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

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
  // Left list filter: all / online-active / offline-inactive
  const [statusFilter, setStatusFilter] = useState("all");
  const messagesEndRef = useRef(null);

  // Initial load from localStorage so data survive tab changes / reload
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminMessages");
      if (stored) {
        setMessages(JSON.parse(stored));
      }

      const storedUnread = localStorage.getItem("adminMessagesUnread");
      if (storedUnread) {
        setUnread(JSON.parse(storedUnread));
      }
    } catch (e) {
      console.error("Failed to parse stored admin messages", e);
    }
  }, []);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    setSocket(s);

    s.emit("join-admin");

    // Get current online student list immediately
    s.on("online-students", ({ studentIds }) => {
      if (!Array.isArray(studentIds)) return;
      setOnlineStudentIds(studentIds.map(String));
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
      setOnlineStudentIds((prev) =>
        prev.filter((id) => String(id) !== sid)
      );
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
        const nextList = [...previousList, msg];
        const limitedList =
          nextList.length > 100 ? nextList.slice(nextList.length - 100) : nextList;

        const updated = {
          ...prev,
          [studentId]: limitedList,
        };
        try {
          localStorage.setItem("adminMessages", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to store admin messages", e);
        }
        return updated;
      });

      // Play tone only for messages coming from student
      if (msg.from !== "admin") {
        playTone();
      }

      if (!activeStudent || activeStudent._id !== studentId) {
        setUnread((prev) => {
          const updated = {
            ...prev,
            [studentId]: (prev[studentId] || 0) + 1,
          };
          try {
            localStorage.setItem(
              "adminMessagesUnread",
              JSON.stringify(updated)
            );
          } catch (e) {
            console.error("Failed to store admin unread", e);
          }
          return updated;
        });
      }
    });

    // Seen status updates for messages (delivered/seen ticks)
    s.on("message-seen-updated", ({ messages: updatedMessages }) => {
      if (!Array.isArray(updatedMessages) || updatedMessages.length === 0) return;

      setMessages((prev) => {
        const next = { ...prev };

        updatedMessages.forEach((um) => {
          if (!um) return;
          const sid = um.from === "admin" ? um.to : um.from;
          const list = next[sid] || [];
          const updatedList = list.map((m) => {
            if (m && um && m._id && um._id && String(m._id) === String(um._id)) {
              return { ...m, ...um };
            }
            return m;
          });
          next[sid] = updatedList;
        });

        try {
          localStorage.setItem("adminMessages", JSON.stringify(next));
        } catch (e) {}

        return next;
      });
    });

    s.on("admin-alert", (alert) => {
      if (alert?.type === "new-message") {
        toast.info(`New message from student: ${alert.from}`);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [activeStudent]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const users = res.data.users || [];
        const onlyStudents = users.filter((u) => u.role !== "teacher");
        setStudents(onlyStudents);
      } catch (error) {
        toast.error("Failed to load students list");
      }
    };

    if (token) {
      fetchStudents();
    }
  }, [token]);

  // Auto-select active student (prefer unread), so chat starts immediately
  useEffect(() => {
    if (activeStudent || !students || students.length === 0) return;
    const pick = students.find((s) => unread[String(s._id)] > 0) || students[0];
    if (pick) setActiveStudent(pick);
  }, [students, unread, activeStudent]);

  const handleSelectStudent = (student) => {
    setActiveStudent(student);
    setUnread((prev) => {
      const updated = { ...prev, [student._id]: 0 };
      try {
        localStorage.setItem(
          "adminMessagesUnread",
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error("Failed to store admin unread", e);
      }
      return updated;
    });
  };

  // Load conversation from DB when selecting a student
  useEffect(() => {
    const loadFromDb = async () => {
      if (!activeStudent?._id || !token) return;
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${activeStudent._id}?limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = res.data?.messages || [];
        // Merge with any socket messages that arrived while DB was loading.
        setMessages((prev) => {
          const currentList = prev[activeStudent._id] || [];
          const merged = [...currentList, ...list];

          const seen = new Map();
          for (const m of merged) {
            if (m?._id) {
              seen.set(String(m._id), m);
            }
          }
          const deduped = Array.from(seen.values());
          deduped.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const updated = { ...prev, [activeStudent._id]: deduped.slice(-100) };
          try {
            localStorage.setItem("adminMessages", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      } catch (e) {
        // keep local cache if API fails
      }
    };
    loadFromDb();
  }, [activeStudent?._id, token]);

  const activeChatMessages = useMemo(
    () => (activeStudent ? messages[activeStudent._id] || [] : []),
    [messages, activeStudent]
  );

  const displayedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    if (statusFilter === "active") {
      return students.filter((s) => onlineStudentIds.includes(String(s._id)));
    }
    if (statusFilter === "inactive") {
      return students.filter((s) => !onlineStudentIds.includes(String(s._id)));
    }
    return students;
  }, [students, onlineStudentIds, statusFilter]);

  // Auto-scroll to bottom when active chat messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [activeChatMessages.length, activeStudent?._id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !activeStudent || !input.trim()) return;

    const text = input.trim();

    socket.emit("admin-send-message", {
      studentId: activeStudent._id,
      message: text,
    });

    setInput("");
  };

  // When chat is open, mark student messages as seen
  useEffect(() => {
    if (!socket || !activeStudent?._id) return;
    const sid = String(activeStudent._id);

    const unseenIds = activeChatMessages
      .filter((m) => m?.from === sid && !m?.seenByAdmin && m?._id)
      .slice(-20)
      .map((m) => m._id);

    if (unseenIds.length === 0) return;

    // optimistic update so ticks change instantly
    setMessages((prev) => {
      const updated = { ...prev };
      const list = updated[sid] || [];
      updated[sid] = list.map((m) => {
        if (m?._id && unseenIds.some((id) => String(id) === String(m._id))) {
          return {
            ...m,
            seenByAdmin: true,
            seenAtAdmin: new Date().toISOString(),
          };
        }
        return m;
      });
      try {
        localStorage.setItem("adminMessages", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    socket.emit("admin-mark-seen", {
      studentId: sid,
      messageIds: unseenIds,
    });
  }, [socket, activeStudent?._id, activeChatMessages]);

  return (
    <Container fluid className="py-3">
      <Row>
        <Col
          md={4}
          className="border-end"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <h5 className="mb-3">Students Messages</h5>
          <Form.Select
            size="sm"
            aria-label="Filter students by online status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mb-2"
          >
            <option value="all">All Students</option>
            <option value="active">🟢 Active (Online)</option>
            <option value="inactive">🔴 Unactive (Offline)</option>
          </Form.Select>
          <ListGroup
          style={{
            maxHeight: "300px",   // height control karo (approx 5 items)
            overflowY: "auto",
          }}
        >
          {displayedStudents.map((s) => (
            <ListGroup.Item
              key={s._id}
              action
              active={activeStudent && activeStudent._id === s._id}
              onClick={() => handleSelectStudent(s)}
              className="d-flex justify-content-between align-items-center"
            >
            <span className="d-flex align-items-center gap-2">
            {(() => {
              const isOnline = onlineStudentIds.some(
                (id) => String(id) === String(s._id)
              );
          
              return (
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: isOnline ? "#28a745" : "#dc3545", // ✅ green / red
                    boxShadow: `0 0 4px ${
                      isOnline
                        ? "rgba(40,167,69,0.8)"
                        : "rgba(220,53,69,0.8)"
                    }`,
                  }}
                />
              );
            })()}
          
            <span>
              {s.name}
              <small className="text-muted d-block">{s.email}</small>
            </span>
          </span>
        
              {unread[s._id] > 0 && (
                <Badge bg="danger" className="blinking-alert">
                  {unread[s._id]}
                </Badge>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
          <div className="mt-3">
          {
            activeChatMessages && activeChatMessages.length > 0 && (
              <Card className="last-message-card border-0 mt-5">
              <Card.Body>
                <h6 className="mb-5 title">Last Message</h6>
            
                {activeChatMessages.length > 0 ? (
                  <>
                    {activeChatMessages.slice(-1).map((msg) => {
                      const isAdminMsg = msg?.from === "admin";
            
                      return (
                        <div
                          key={msg?._id || msg?.createdAt || msg?.message}
                          className={`d-flex ${
                            isAdminMsg ? "justify-content-end" : "justify-content-start"
                          } mb-2`}
                        >
                          <div className={`bubble ${isAdminMsg ? "you" : "student"}`}>
                            {msg?.message}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-muted mb-0">No messages yet</p>
                )}
              </Card.Body>
            </Card>
            )




            
          }
          </div>
        
        </Col>

        <Col md={8}>
          {activeStudent ? (
            <>
             <div
  className="d-flex justify-content-between align-items-center mb-2"
  style={{ borderBottom: "1px solid #eee", paddingBottom: 8 }}
>
  {/* LEFT SIDE */}
  <h5 className="mb-0">
    Chat with {activeStudent.name}{" "}
    <small className="text-muted">
      ({activeStudent.email})
    </small>
  </h5>

  {/* RIGHT SIDE BUTTON */}
  <Button
    variant="outline-danger"
    size="sm"
    onClick={() => {
      setMessages([]);
      try {
        localStorage.removeItem(`studentMessages_${activeStudent._id}`);
        localStorage.setItem(
          `studentMessagesAlert_${activeStudent._id}`,
          "false"
        );
      } catch (e) {
        console.error("Failed to clear student history", e);
      }

      axios
        .delete(
          `${process.env.REACT_APP_BASE_ADMIN_API}/messages/conversation/${activeStudent._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {});
    }}
  >
    Clear History
  </Button>
</div>

              <div
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  background: "#fff",
                }}
              >  <span className="text-muted">Student:</span> <span className="text-bold" style={{ fontSize: "1.2rem" , fontWeight: "bold" , }}>{activeStudent.name}</span>
              
              <hr></hr>
                {activeChatMessages.map((m, idx) => {
                  const isAdmin = m.from === "admin";
                  const deliveredToStudent = !!m?.deliveredToStudent;
                  const seenByStudent = !!m?.seenByStudent;
                  const ticks = seenByStudent ? "✓✓" : deliveredToStudent ? "✓" : "";
                  const tickColor = seenByStudent ? "#28a745" : "#6c757d";
                  return (
                    <div
                      key={idx}
                      className={`d-flex mb-2 ${
                        isAdmin ? "justify-content-end" : "justify-content-start"
                      }`}
                    >
                      <div
                        style={{
                          maxWidth: "75%",
                          borderRadius: 16,
                          padding: "6px 12px",
                          backgroundColor: isAdmin ? "#ffc107" : "#e9ecef",
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
                          {isAdmin && ticks && (
                            <span style={{ marginLeft: 6, color: tickColor, fontSize: 12 }}>
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

              <Form onSubmit={handleSend} className="d-flex gap-2">
                <Form.Control
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" className="buttonColor">
                  Send
                </Button>
              </Form>
            </>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: "70vh" }}
            >
              <p className="text-muted mb-0">
                Select a student from the left list to start chat.
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminMessages;

