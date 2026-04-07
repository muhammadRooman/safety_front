import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Container, Breadcrumb, Card, Spinner, Button, Badge, Alert } from "react-bootstrap";

const JITSI_DOMAIN = "meet.jit.si";

function useJitsi(roomName, displayName) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    const loadScript = () =>
      new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi"));
        document.body.appendChild(script);
      });

    let isMounted = true;

    loadScript()
      .then(() => {
        if (!isMounted || !containerRef.current) return;

        if (apiRef.current) apiRef.current.dispose();

        const options = {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          },
          userInfo: {
            displayName: displayName || "Student",
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      })
      .catch((err) => console.error("Jitsi init failed", err));

    return () => {
      isMounted = false;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName]);

  return containerRef;
}

export default function StudentLiveClass() {
  const token = useSelector((state) => state.auth.token);
  const studentName = useSelector((state) => state.auth.name);

  const [activeClass, setActiveClass] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const jitsiRef = useJitsi(activeClass?.roomName, studentName);

  // Fetch Active Live Class (Priority)
  const fetchActiveClass = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student/active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success && res.data.data) {
        setActiveClass(res.data.data);
        setError("");
      } else {
        setActiveClass(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setActiveClass(null);
        setError("");
      } else {
        console.error("Active class error:", err);
        setError("Failed to check active class");
      }
    }
  };

  // Fetch All Upcoming/Assigned Classes
  const fetchAllClasses = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllClasses(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setAllClasses([]);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchActiveClass(), fetchAllClasses()]);
    setLoading(false);
  };

  // Auto refresh every 8 seconds
  useEffect(() => {
    if (!token) return;

    refreshAll();
    const interval = setInterval(refreshAll, 8000); // 8 seconds is good balance

    return () => clearInterval(interval);
  }, [token]);

  const formatTime = (time) => {
    if (!time) return "--:--";
    const date = new Date(time);
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const isLiveNow = (cls) => cls.status === "live";

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Live Class</Breadcrumb.Item>
      </Breadcrumb>

      <h3 className="fw-bold mb-4">Live Class</h3>

      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Live Session</Card.Title>
            <Button variant="outline-primary" size="sm" onClick={refreshAll} disabled={loading}>
              {loading ? "Checking..." : "Refresh"}
            </Button>
          </div>

          {loading && !activeClass ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3 text-muted">Checking for live class...</p>
            </div>
          ) : activeClass ? (
            // ==================== LIVE CLASS UI ====================
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-1">{activeClass.title}</h5>
                  <Badge bg="success" className="px-3 py-2 fs-6">
                    LIVE NOW
                  </Badge>
                </div>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => setActiveClass(null)}
                >
                  Leave Class
                </Button>
              </div>

              <div 
                ref={jitsiRef} 
                style={{ 
                  width: "100%", 
                  height: "550px", 
                  borderRadius: "10px",
                  border: "1px solid #ddd"
                }} 
              />
            </div>
          ) : (
            // ==================== NO LIVE CLASS ====================
            <div className="text-center py-5">
              <Alert variant="info">
                <p className="mb-1 fw-semibold">No active live class right now.</p>
                <p className="mb-0">Your teacher will start the session shortly.</p>
              </Alert>

              {allClasses.length > 0 && (
                <>
                  <h6 className="mt-4 mb-3 text-start">Your Upcoming Classes:</h6>
                  {allClasses.map((cls) => (
                    <Card key={cls._id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-2">{cls.title}</h6>
                            <div className="d-flex gap-3 text-muted small">
                              <div>
                                <strong>Time:</strong> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                              </div>
                              <div>
                                <Badge 
                                  bg={isLiveNow(cls) ? "success" : "warning"}
                                  className="text-capitalize"
                                >
                                  {cls.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {isLiveNow(cls) && (
                            <Button 
                              variant="success"
                              onClick={() => setActiveClass(cls)}
                            >
                              Join Live
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </>
              )}

              {allClasses.length === 0 && (
                <p className="text-muted mt-3">No classes assigned yet.</p>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}