import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Container,
  Breadcrumb,
  Card,
  Spinner,
  Button,
  Badge,
} from "react-bootstrap";

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
        script.onerror = () => reject(new Error("Failed to load Jitsi script"));
        document.body.appendChild(script);
      });

    let isMounted = true;

    loadScript()
      .then(() => {
        if (!isMounted || !containerRef.current) return;
        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }

        const options = {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            // Auto-join so student remote tiles can appear immediately.
            prejoinPageEnabled: false,
          },
          userInfo: {
            displayName: displayName || "Student",
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      })
      .catch((err) => {
        console.error("Failed to init Jitsi", err);
      });

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
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningClass, setJoiningClass] = useState(null);

  const jitsiRef = useJitsi((joiningClass || activeClass)?.roomName || null, studentName);
  const effectiveClass = joiningClass || activeClass;

  const fetchAssignedClasses = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClasses(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch assigned classes", err);
      setClasses([]);
    }
  };

  const fetchActive = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student/active`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const nextActive = res.data?.data || null;
      setActiveClass(nextActive);
      if (nextActive) {
        setJoiningClass(nextActive);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setActiveClass(null);
        setJoiningClass(null);
      } else {
        console.error("Failed to fetch active live class", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchAssignedClasses(), fetchActive()]);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    fetchAll();
    const id = setInterval(() => {
      fetchAssignedClasses();
      fetchActive();
    }, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const formatTime = (time) => {
  const [hour, minute] = time.split(":");
  let h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12;
  h = h === 0 ? 12 : h; // 0 ko 12 bana do

  return `${h}:${minute} ${ampm}`;
};
  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Live Class</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Card.Title className="mb-0">Live Class (Jitsi)</Card.Title>
            <Button variant="outline-secondary" size="sm" onClick={fetchAll} disabled={loading}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2 mb-0 text-muted">
                Checking for active live class…
              </p>
            </div>
          ) : !effectiveClass ? (
            <div className="text-center py-4">
              <p className="mb-1 fw-semibold">
                No live class is active at the moment.
              </p>
              <p className="mb-0 text-muted">
                Please wait. Your teacher will start the class here.
              </p>
              {classes.length > 0 && (
              <div className="mt-3">
  <p className="mb-3 fw-semibold">Assigned Classes:</p>

  {classes.map((cls) => (
    <div
      key={cls._id}
      className="d-flex justify-content-between align-items-center mb-3 p-3 shadow-sm"
      style={{
        borderRadius: "12px",
        background: "#fff",
        border: "1px solid #eee",
      }}
    >
      {/* LEFT SIDE */}
      <div className="d-flex flex-column gap-2">

        {/* Title */}
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-muted">Course:</span>
          <Badge
            bg="success"
            className="px-3 py-2 fw-semibold text-truncate"
            style={{ maxWidth: "180px", borderRadius: "20px" }}
            title={cls.title}
          >
            {cls.title}
          </Badge>
        </div>

        {/* Time */}
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-muted">Time:</span>
          <Badge bg="light" text="dark" className="px-3 py-2">
            {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
          </Badge>
        </div>

        {/* Status */}
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-muted">Status:</span>
          <Badge
            bg={
              cls.status === "live"
                ? "success"
                : cls.status === "scheduled"
                ? "warning"
                : cls.status === "ended"
                ? "secondary"
                : "dark"
            }
            className="px-3 py-2 text-capitalize"
          >
            {cls.status}
          </Badge>
        </div>
      </div>

      {/* RIGHT SIDE BUTTON */}
      <Button
        size="sm"
        variant="primary"
        className="px-3"
        onClick={() => setJoiningClass(cls)}
        disabled={cls.status !== "live"} // only join if live
      >
        {cls.status === "live" ? "Join Now" : "Not Live"}
      </Button>
    </div>
  ))}
</div>
              )}
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">
                  Joined: {effectiveClass?.title || "Live Class"}
                </div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setJoiningClass(null)}
                >
                  Leave
                </Button>
              </div>
              <div
                ref={jitsiRef}
                style={{ width: "100%", height: 450, borderRadius: 8 }}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

