import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, ListGroup, Form, Button, Badge, Modal, Breadcrumb, InputGroup } from "react-bootstrap";
import { io } from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiSend, FiTrash2, FiSearch, FiUser, FiArrowLeft } from "react-icons/fi";
import "./AdminMessages.css";
import { MdPersonSearch } from "react-icons/md";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Mobile View Logic: Agar activeStudent hai, toh mobile par list chhupa do
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  const messagesEndRef = useRef(null);

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
    try {
      const stored = localStorage.getItem("adminMessages");
      if (stored) setMessages(JSON.parse(stored));
      const storedUnread = localStorage.getItem("adminMessagesUnread");
      if (storedUnread) setUnread(JSON.parse(storedUnread));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);
    s.emit("join-admin");

    s.on("online-students", ({ studentIds }) => setOnlineStudentIds(studentIds.map(String)));
    s.on("student-online", ({ studentId }) => setOnlineStudentIds(prev => [...new Set([...prev, String(studentId)])]));
    s.on("student-offline", ({ studentId }) => setOnlineStudentIds(prev => prev.filter(id => id !== String(studentId))));

    s.on("receive-message", (msg) => {
      const studentId = msg.from === "admin" ? msg.to : msg.from;
      setMessages((prev) => {
        const updated = { ...prev, [studentId]: [...(prev[studentId] || []), msg].slice(-100) };
        localStorage.setItem("adminMessages", JSON.stringify(updated));
        return updated;
      });
      if (msg.from !== "admin") new Audio("/notification.mp3").play().catch(() => {});
      if (!activeStudent || activeStudent._id !== studentId) {
        setUnread(prev => {
          const updated = { ...prev, [studentId]: (prev[studentId] || 0) + 1 };
          localStorage.setItem("adminMessagesUnread", JSON.stringify(updated));
          return updated;
        });
      }
    });

    return () => s.disconnect();
  }, [activeStudent]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`, { headers: { Authorization: `Bearer ${token}` } });
        setStudents((res.data.users || []).filter(u => u.role !== "teacher"));
      } catch { toast.error("Failed to load students"); }
    };
    if (token) fetchStudents();
  }, [token]);

  const handleSelectStudent = (student) => {
    setActiveStudent(student);
    setIsMobileListVisible(false); // Mobile: Student select karte hi list hide
    setUnread(prev => {
      const updated = { ...prev, [student._id]: 0 };
      localStorage.setItem("adminMessagesUnread", JSON.stringify(updated));
      return updated;
    });
  };

  const displayedStudents = useMemo(() => {
    let filtered = students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (statusFilter === "active") filtered = filtered.filter(s => onlineStudentIds.includes(String(s._id)));
    if (statusFilter === "inactive") filtered = filtered.filter(s => !onlineStudentIds.includes(String(s._id)));
    return filtered.sort((a, b) => (unread[b._id] || 0) - (unread[a._id] || 0));
  }, [students, onlineStudentIds, statusFilter, unread, searchTerm]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeStudent]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!socket || !activeStudent || !input.trim()) return;
    socket.emit("admin-send-message", { studentId: activeStudent._id, message: input.trim() });
    setInput("");
  };

  const handleClearChat = () => {
    setMessages(prev => {
      const updated = { ...prev };
      delete updated[activeStudent._id];
      localStorage.setItem("adminMessages", JSON.stringify(updated));
      return updated;
    });
    setShowClearModal(false);
    toast.success("Chat cleared");
  };

  return (
    <Container fluid className="admin-chat-container p-0">
      <div className="chat-layout">
        
        {/* SIDEBAR - Mobile par hide hoga jab chat open ho */}
        <aside className={`chat-sidebar ${!isMobileListVisible ? "d-none d-md-flex" : "d-flex"}`}>
          <div className="sidebar-header">
            <Breadcrumb className="custom-breadcrumb">
              <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Home</Breadcrumb.Item>
              <Breadcrumb.Item active>Messages</Breadcrumb.Item>
            </Breadcrumb>
            <h4 className="fw-bold">Messages</h4>
            
            <InputGroup size="sm" className="mt-2">
              <InputGroup.Text><FiSearch /></InputGroup.Text>
              <Form.Control 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
<InputGroup size="sm" className="mt-2 custom-filter-group">
  <InputGroup.Text>
    <MdPersonSearch size={18} />
  </InputGroup.Text>
  <Form.Select 
    value={statusFilter} 
    onChange={(e) => setStatusFilter(e.target.value)}
    className="filter-select"
  >
    <option value="all">All Chats</option>
    <option value="active">Online</option>
    <option value="inactive">Offline</option>
  </Form.Select>
</InputGroup>
           
          </div>

          <div className="student-list-container">
            <ListGroup variant="flush">
              {displayedStudents.map((s) => (
                <ListGroup.Item
                  key={s._id}
                  onClick={() => handleSelectStudent(s)}
                  className={`student-item ${activeStudent?._id === s._id ? "active-chat" : ""}`}
                >
                  <div className="avatar-wrapper">
                    <div className="avatar-placeholder"><FiUser /></div>
                    <span className={`status-indicator ${onlineStudentIds.includes(String(s._id)) ? "online" : "offline"}`} />
                  </div>
                  <div className="student-info">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-truncate">{s.name}</h6>
                      {unread[s._id] > 0 && <Badge pill bg="primary" className="unread-badge">{unread[s._id]}</Badge>}
                    </div>
                    <small className="text-muted text-truncate">{s.email}</small>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <main className={`chat-main ${isMobileListVisible ? "d-none d-md-flex" : "d-flex"}`}>
          {activeStudent ? (
            <>
              <header className="chat-header">
                <div className="d-flex align-items-center gap-2">
                  {/* Mobile Back Button */}
                  <Button variant="link" className="d-md-none p-0 text-dark" onClick={() => setIsMobileListVisible(true)}>
                    <FiArrowLeft size={24} />
                  </Button>
                  
                  <div className="avatar-placeholder-sm"><FiUser /></div>
                  <div className="overflow-hidden">
                    <h5 className="mb-0 text-truncate">{activeStudent.name}</h5>
                    <small className={onlineStudentIds.includes(String(activeStudent._id)) ? "text-success" : "text-muted"}>
                      {onlineStudentIds.includes(String(activeStudent._id)) ? "Online" : "Offline"}
                    </small>
                  </div>
                </div>
                <Button variant="link" className="text-danger p-0" onClick={() => setShowClearModal(true)}>
                  <FiTrash2 size={20} />
                </Button>
              </header>

              <div className="chat-messages-area">
                {(messages[activeStudent._id] || []).map((m, idx) => {
                  const isAdmin = m.from === "admin";
                  return (
                    <div key={idx} className={`message-row ${isAdmin ? "row-out" : "row-in"}`}>
                      <div className={`message-bubble ${isAdmin ? "bubble-out" : "bubble-in"}`}>
                        <div className="message-content">{renderMessageWithLinks(m.message)}</div>
                        <div className="message-time">
                          {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <footer className="chat-footer">
                <Form onSubmit={handleSend} className="input-wrapper">
                  <Form.Control 
                    placeholder="Type a message..." 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className="message-input"
                  />
                  <Button type="submit" className="send-btn shadow-sm">
                    <FiSend />
                  </Button>
                </Form>
              </footer>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon shadow-sm"><FiSend size={40} /></div>
              <h5>Select a Student</h5>
              <p className="text-muted">Start a conversation to provide support.</p>
            </div>
          )}
        </main>
      </div>

      <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
        <Modal.Body className="text-center p-4">
          <h5 className="mb-3">Clear History?</h5>
          <p className="text-muted">This will permanently delete your conversation with student.</p>
          <div className="d-flex gap-2 justify-content-center mt-4">
            <Button variant="light" className="px-4" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="danger" className="px-4" onClick={handleClearChat}>Delete</Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminMessages;


// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Container, ListGroup, Form, Button, Badge, Modal, Breadcrumb } from "react-bootstrap";
// import { io } from "socket.io-client";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import "./AdminMessages.css";
// import { useNavigate } from "react-router-dom";

// const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";
// const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// const AdminMessages = () => {
//   const navigate = useNavigate();
//   const token = useSelector((state) => state.auth.token);

//   const [socket, setSocket] = useState(null);
//   const [students, setStudents] = useState([]);
//   const [activeStudent, setActiveStudent] = useState(null);
//   const [messages, setMessages] = useState({});
//   const [input, setInput] = useState("");
//   const [unread, setUnread] = useState({});
//   const [onlineStudentIds, setOnlineStudentIds] = useState([]);
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [showClearModal, setShowClearModal] = useState(false);

//   const messagesEndRef = useRef(null);

//   const renderMessageWithLinks = (text) => {
//     const raw = String(text || "");
//     const parts = raw.split(URL_REGEX);
//     return parts.map((part, idx) => {
//       if (/^https?:\/\//i.test(part)) {
//         return (
//           <a key={`${part}-${idx}`} href={part} target="_blank" rel="noopener noreferrer">
//             {part}
//           </a>
//         );
//       }
//       return <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>;
//     });
//   };

//   // Load from localStorage
//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem("adminMessages");
//       if (stored) setMessages(JSON.parse(stored));
//       const storedUnread = localStorage.getItem("adminMessagesUnread");
//       if (storedUnread) setUnread(JSON.parse(storedUnread));
//     } catch (e) { console.error("Failed to parse stored admin messages", e); }
//   }, []);

//   // Socket Connection
//   useEffect(() => {
//     const s = io(SOCKET_URL, { transports: ["websocket"] });
//     setSocket(s);
//     s.emit("join-admin");

//     s.on("online-students", ({ studentIds }) => {
//       setOnlineStudentIds(Array.isArray(studentIds) ? studentIds.map(String) : []);
//     });

//     s.on("student-online", ({ studentId }) => {
//       if (!studentId) return;
//       const sid = String(studentId);
//       setOnlineStudentIds((prev) => prev.includes(sid) ? prev : [...prev, sid]);
//     });

//     s.on("student-offline", ({ studentId }) => {
//       if (!studentId) return;
//       const sid = String(studentId);
//       setOnlineStudentIds((prev) => prev.filter((id) => id !== sid));
//     });

//     const playTone = () => {
//       try { new Audio("/notification.mp3").play().catch(() => {}); } catch {}
//     };

//     s.on("receive-message", (msg) => {
//       const studentId = msg.from === "admin" ? msg.to : msg.from;

//       // Update messages
//       setMessages((prev) => {
//         const previousList = prev[studentId] || [];
//         const nextList = [...previousList, msg].slice(-100);
//         const updated = { ...prev, [studentId]: nextList };
//         try { localStorage.setItem("adminMessages", JSON.stringify(updated)); } catch {}
//         return updated;
//       });

//       if (msg.from !== "admin") playTone();

//       // Update unread count
//       if (!activeStudent || activeStudent._id !== studentId) {
//         setUnread((prev) => {
//           const updated = { ...prev, [studentId]: (prev[studentId] || 0) + 1 };
//           try { localStorage.setItem("adminMessagesUnread", JSON.stringify(updated)); } catch {}
//           return updated;
//         });
//       }
//     });

//     return () => s.disconnect();
//   }, [activeStudent]);

//   // Fetch Students
//   useEffect(() => {
//     const fetchStudents = async () => {
//       try {
//         const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`, { headers: { Authorization: `Bearer ${token}` } });
//         const onlyStudents = (res.data.users || []).filter(u => u.role !== "teacher");
//         setStudents(onlyStudents);
//       } catch { toast.error("Failed to load students list"); }
//     };
//     if (token) fetchStudents();
//   }, [token]);

//   // Auto-select student
//   useEffect(() => {
//     if (activeStudent || !students.length) return;
//     const pick = students.find((s) => unread[String(s._id)] > 0) || students[0];
//     if (pick) setActiveStudent(pick);
//   }, [students, unread]);

//   const handleSelectStudent = (student) => {
//     setActiveStudent(student);
//     setUnread((prev) => {
//       const updated = { ...prev, [student._id]: 0 };
//       try { localStorage.setItem("adminMessagesUnread", JSON.stringify(updated)); } catch {}
//       return updated;
//     });
//   };

//   const activeChatMessages = useMemo(() => activeStudent ? messages[activeStudent._id] || [] : [], [messages, activeStudent]);

//   // Sort students: unread top
//   const displayedStudents = useMemo(() => {
//     if (!Array.isArray(students)) return [];

//     const studentsWithUnread = students.map(s => ({
//       ...s,
//       unreadCount: unread[s._id] || 0
//     }));

//     let filtered = studentsWithUnread;
//     if (statusFilter === "active") filtered = filtered.filter(s => onlineStudentIds.includes(String(s._id)));
//     if (statusFilter === "inactive") filtered = filtered.filter(s => !onlineStudentIds.includes(String(s._id)));

//     // Sort descending unread count
//     filtered.sort((a, b) => b.unreadCount - a.unreadCount);

//     return filtered;
//   }, [students, onlineStudentIds, statusFilter, unread]);

//   // Auto-scroll
//   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [activeChatMessages.length]);

//   const handleSend = (e) => {
//     e.preventDefault();
//     if (!socket || !activeStudent || !input.trim()) return;
//     socket.emit("admin-send-message", { studentId: activeStudent._id, message: input.trim() });
//     setInput("");
//   };
// const handleClearChat = () => {
//   if (!activeStudent) return;

//   setMessages((prev) => {
//     const updated = { ...prev };
//     delete updated[activeStudent._id];

//     try {
//       localStorage.setItem("adminMessages", JSON.stringify(updated));
//     } catch {}

//     return updated;
//   });

//   setUnread((prev) => {
//     const updated = { ...prev, [activeStudent._id]: 0 };

//     try {
//       localStorage.setItem("adminMessagesUnread", JSON.stringify(updated));
//     } catch {}

//     return updated;
//   });

//   setShowClearModal(false);
//   toast.success("Chat cleared successfully");
// };
//   return (
//     <Container fluid className="admin-messages-page py-3 px-3 px-md-4" >
//       <Breadcrumb>
//         <Breadcrumb.Item onClick={() => navigate("/dashboard")}>Dashboard</Breadcrumb.Item>
//         <Breadcrumb.Item onClick={() => navigate("/dashboard/messages")}>Messages</Breadcrumb.Item>
//       </Breadcrumb>

//       <h3 className="fw-bold mb-1 mb-0 fw-semibold name_heading">Messages</h3>
//       <div className="admin-messages-shell">
//         <aside className="admin-messages-sidebar">
//           <div className="admin-messages-sidebar-header" >
//             <h2 className="admin-messages-sidebar-title">Students Messages</h2>
//             <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-messages-filter">
//               <option value="all">All Students</option>
//               <option value="active">🟢 Active (Online)</option>
//               <option value="inactive">🔴 Unactive (Offline)</option>
//             </Form.Select>
//           </div>

//           <div className="admin-messages-list-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
//             <ListGroup className="admin-messages-list">
//               {displayedStudents.map((s) => (
//                 <ListGroup.Item
//                   key={s._id}
//                   action
//                   active={activeStudent && activeStudent._id === s._id}
//                   onClick={() => handleSelectStudent(s)}
//                   className="d-flex justify-content-between align-items-center"
//                 >
//                   <span className="d-flex align-items-center gap-2 min-w-0">
//                     <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: onlineStudentIds.includes(String(s._id)) ? "#28a745" : "#dc3545" }} />
//                     <span className="d-block min-w-0 text-truncate">
//                       <span className="d-block text-truncate">{s.name}</span>
//                       <small className="text-muted d-block text-truncate">{s.email}</small>
//                     </span>
//                   </span>
//                   {unread[s._id] > 0 && <Badge bg="danger" className="blinking-alert flex-shrink-0">{unread[s._id]}</Badge>}
//                 </ListGroup.Item>
//               ))}
//             </ListGroup>
//           </div>
//         </aside>

//         <section className="admin-messages-main">
//           {activeStudent ? (
//             <>
//               <div className="admin-messages-chat-header">
//                 <h2 className="admin-messages-chat-title">
//                   Chat with {activeStudent.name}
//                   <small className="text-muted d-block d-md-inline ms-md-1">({activeStudent.email})</small>
//                 </h2>
//               </div>
//  <Button
//                   variant="danger"
//                   size="sm"
//                   onClick={() => setShowClearModal(true)}
//                 >
//                   Clear Chat
//                 </Button>
//               <div
//   className="admin-messages-thread"
//   style={{
//     backgroundImage: "url('/msg1.jpg')",
//     backgroundSize: "cover",
//     backgroundPosition: "center",
//     backgroundRepeat: "no-repeat",
  
//     overflowY: "auto"
//   }}
// >
//   {activeChatMessages.map((m, idx) => {
//     const isAdmin = m.from === "admin";
//     return (
//       <div key={idx} className={`admin-msg-row ${isAdmin ? "admin-msg-row--out" : "admin-msg-row--in"}`}>
//         <div className={`admin-msg-bubble ${isAdmin ? "admin-msg-bubble--admin" : "admin-msg-bubble--student"}`}>
//           <div>{renderMessageWithLinks(m.message)}</div>
//           <div className="admin-msg-meta">
//             <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
//           </div>
//         </div>
//       </div>
//     );
//   })}
//   <div ref={messagesEndRef} />
// </div>

//               <Form onSubmit={handleSend} className="admin-messages-composer ">
//                 <div className="admin-messages-composer-inner ">
//                   <Form.Control placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} />
//                   <Button type="submit" className="buttonColor">Send</Button>
//                 </div>
//               </Form>
//             </>
//           ) : (
//             <div className="admin-messages-empty">
//               <p className="text-muted mb-0">Select a student from the left list to start chat.</p>
//             </div>
//           )}
//         </section>
//       </div>

//           {/* ✅ MODAL */}
//       <Modal show={showClearModal} onHide={() => setShowClearModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Clear Chat</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           Are you sure you want to delete this chat?
//         </Modal.Body>
//         <Modal.Footer>
//           <Button onClick={() => setShowClearModal(false)}>Cancel</Button>
//           <Button variant="danger" onClick={handleClearChat}>
//             Delete
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default AdminMessages;