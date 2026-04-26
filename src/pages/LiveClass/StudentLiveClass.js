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
            startWithAudioMuted: true,
            startWithVideoMuted: false,
          },
          userInfo: {
            displayName: displayName || "Student",
          },
        };

        apiRef.current = new window.JitsiMeetExternalAPI(
          JITSI_DOMAIN,
          options
        );
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

  const [allClasses, setAllClasses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedClass, setJoinedClass] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [videoSettingLoaded, setVideoSettingLoaded] = useState(false);

  const jitsiRef = useJitsi(joinedClass?.roomName, studentName);

  const formatTime = (time) => {
    if (!time) return "--:--";
    const date = new Date(time);
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const formatDate = (time) => {
    if (!time) return "--/--/----";
    const date = new Date(time);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const fetchAllClasses = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student`,
        {
          headers: { Authorization: `Bearer ${token}` },
          showGlobalLoader: false,
        }
      );
      setAllClasses(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      if (err?.response?.status === 403) {
        setVideoEnabled(false);
        setJoinedClass(null);
        setAllClasses([]);
      }
      console.error(err);
      setAllClasses([]);
    }
  };

  const fetchVideoSetting = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/settings/video`,
        {
          headers: { Authorization: `Bearer ${token}` },
          showGlobalLoader: false,
        }
      );
      const enabled = res.data?.enabled !== false;
      setVideoEnabled(enabled);
      if (!enabled) {
        setJoinedClass(null);
        setAllClasses([]);
      }
      return enabled;
    } catch (err) {
      // best-effort: default true
      return true;
    } finally {
      setVideoSettingLoaded(true);
    }
  };

  /** Manual refresh only — shows “Checking…” on the button (no full-screen main loader). */
  const manualRefresh = async () => {
    setRefreshing(true);
    try {
      const enabled = await fetchVideoSetting();
      if (enabled) await fetchAllClasses();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const initialFetch = async () => {
      const enabled = await fetchVideoSetting();
      if (enabled) await fetchAllClasses();
      setInitialLoading(false);
    };

    initialFetch();

    // Auto-sync access changes from admin side without manual refresh.
    const interval = setInterval(async () => {
      const enabled = await fetchVideoSetting();
      if (enabled) await fetchAllClasses();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const isClassPast = (cls) => {
    const now = new Date();
    return new Date(cls.endTime) < now;
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Live Class</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className=" mb-0 fw-semibold name_heading">Live Class</h3>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={manualRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Checking..." : "Refresh"}
        </Button>
      </div>

      <Card
        className="shadow-sm border-0 border-start border-success border-4"
        style={{ borderRadius: "12px" }}
      >
        <Card.Body>
          {initialLoading || !videoSettingLoaded ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3 text-muted">Loading your classes...</p>
            </div>
          ) : !videoEnabled ? (
            <div className="text-center py-5">
              <p className="mb-2 fw-semibold" style={{ color: "#e74c3c" }}>
                Live class video is OFF by admin.
              </p>
              <p className="text-muted mb-0">
                Fees paid karne ke baad aap ko video access mil jayegi.
              </p>
            </div>
          ) : (
            <>
              {/* LIVE PLAYER */}
              {joinedClass && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="mb-1">{joinedClass.title}</h5>
                      <Badge bg="success">● LIVE NOW</Badge>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setJoinedClass(null)}
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
                      border: "1px solid #ddd",
                    }}
                  />
                </div>
              )}

              {/* CLASSES LIST */}
              {allClasses.length > 0 ? (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {[...allClasses]
                    .sort((a, b) => {
                      const now = new Date();

                      const aPast = new Date(a.endTime) < now;
                      const bPast = new Date(b.endTime) < now;

                      // LIVE first
                      if (a.status === "live" && b.status !== "live")
                        return -1;
                      if (a.status !== "live" && b.status === "live")
                        return 1;

                      // Upcoming next
                      if (!aPast && bPast) return -1;
                      if (aPast && !bPast) return 1;

                      // Same → nearest time
                      return new Date(a.startTime) - new Date(b.startTime);
                    })
                    .map((cls) => {
                      const past = isClassPast(cls);

                      return (
                        <Card
                          key={cls._id}
                          className="mb-3 shadow-sm border-0 border-start border-success border-4"
                        >
                          <Card.Body className="d-flex justify-content-between align-items-center flex-wrap">
                            <div className="flex-grow-1 mb-2">
                              <h6>{cls.title}</h6>

                              <div className="d-flex gap-3 text-muted small flex-wrap">
                                <div>
                                  <strong>Date:</strong>{" "}
                                  {formatDate(cls.startTime)}
                                </div>

                                <div>
                                  <strong>Time:</strong>{" "}
                                  {formatTime(cls.startTime)} -{" "}
                                  {formatTime(cls.endTime)}
                                </div>

                                <Badge
                                  bg={
                                    past
                                      ? "danger"
                                      : cls.status === "live"
                                      ? "success"
                                      : "secondary"
                                  }
                                >
                                  {past ? "Ended" : cls.status}
                                </Badge>
                              </div>
                            </div>

                            {!past && cls.status === "live" && (
                              <Button
                                variant="success"
                                onClick={() => setJoinedClass(cls)}
                              >
                                Join Live
                              </Button>
                            )}

                            {past && (
                              <Button variant="secondary" disabled>
                                Class Ended
                              </Button>
                            )}
                          </Card.Body>
                        </Card>
                      );
                    })}
                </div>
              ) : (
             <p style={{ color: "#e74c3c" }}>
  No session assigned yet. Kindly contact the admin if you have not received your video call session.
</p>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { Container, Breadcrumb, Card, Spinner, Button, Badge, Alert } from "react-bootstrap";

// const JITSI_DOMAIN = "meet.jit.si";

// function useJitsi(roomName, displayName) {
//   const containerRef = useRef(null);
//   const apiRef = useRef(null);

//   useEffect(() => {
//     if (!roomName) return;

//     const loadScript = () =>
//       new Promise((resolve, reject) => {
//         if (window.JitsiMeetExternalAPI) return resolve();
//         const script = document.createElement("script");
//         script.src = "https://meet.jit.si/external_api.js";
//         script.async = true;
//         script.onload = () => resolve();
//         script.onerror = () => reject(new Error("Failed to load Jitsi"));
//         document.body.appendChild(script);
//       });

//     let isMounted = true;

//     loadScript()
//       .then(() => {
//         if (!isMounted || !containerRef.current) return;
//         if (apiRef.current) apiRef.current.dispose();

//         const options = {
//           roomName,
//           parentNode: containerRef.current,
//           width: "100%",
//           height: "100%",
//           configOverwrite: {
//             prejoinPageEnabled: false,
//             startWithAudioMuted: true,
//             startWithVideoMuted: false,
//           },
//           userInfo: {
//             displayName: displayName || "Student",
//           },
//         };

//         apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
//       })
//       .catch((err) => console.error("Jitsi init failed", err));

//     return () => {
//       isMounted = false;
//       if (apiRef.current) {
//         apiRef.current.dispose();
//         apiRef.current = null;
//       }
//     };
//   }, [roomName, displayName]);

//   return containerRef;
// }

// export default function StudentLiveClass() {
//   const token = useSelector((state) => state.auth.token);
//   const studentName = useSelector((state) => state.auth.name);

//   const [activeClass, setActiveClass] = useState(null);
//   const [allClasses, setAllClasses] = useState([]);
//   const [initialLoading, setInitialLoading] = useState(true);   // Only for first load
//   const [refreshing, setRefreshing] = useState(false);         // Silent refresh indicator (optional)

//   const jitsiRef = useJitsi(activeClass?.roomName, studentName);

//   // Fetch Active Live Class
//   const fetchActiveClass = async () => {
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student/active`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (res.data?.success && res.data.data) {
//         setActiveClass(res.data.data);
//       } else {
//         setActiveClass(null);
//       }
//     } catch (err) {
//       if (err.response?.status !== 404) {
//         console.error("Active class error:", err);
//       }
//       setActiveClass(null);
//     }
//   };

//   // Fetch All Assigned Classes
//   const fetchAllClasses = async () => {
//     try {
//       const res = await axios.get(
//         `${process.env.REACT_APP_BASE_ADMIN_API}/admin/live-class/student`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setAllClasses(Array.isArray(res.data?.data) ? res.data.data : []);
//     } catch (err) {
//       console.error("Failed to fetch classes:", err);
//       setAllClasses([]);
//     }
//   };

//   // Silent Refresh (No Loader)
//   const silentRefresh = async () => {
//     setRefreshing(true);
//     await Promise.all([fetchActiveClass(), fetchAllClasses()]);
//     setRefreshing(false);
//   };

//   // Initial Load + Auto Refresh
//   useEffect(() => {
//     if (!token) return;

//     // First time load with spinner
//     const initialFetch = async () => {
//       await Promise.all([fetchActiveClass(), fetchAllClasses()]);
//       setInitialLoading(false);
//     };

//     initialFetch();

//     // Silent polling every 8 seconds
//     const interval = setInterval(silentRefresh, 8000);

//     return () => clearInterval(interval);
//   }, [token]);

//   const formatTime = (time) => {
//     if (!time) return "--:--";
//     const date = new Date(time);
//     let h = date.getHours();
//     const m = date.getMinutes().toString().padStart(2, "0");
//     const ampm = h >= 12 ? "PM" : "AM";
//     h = h % 12 || 12;
//     return `${h}:${m} ${ampm}`;
//   };

//   return (
//     <Container className="py-4">
//       <Breadcrumb>
//         <Breadcrumb.Item href="/dashboard">Dashboard</Breadcrumb.Item>
//         <Breadcrumb.Item active>Live Class</Breadcrumb.Item>
//       </Breadcrumb>

//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h3 className="fw-bold mb-0">Live Class</h3>
//         <Button 
//           variant="outline-primary" 
//           size="sm" 
//           onClick={silentRefresh}
//           disabled={refreshing}
//         >
//           {refreshing ? "Checking..." : "Refresh"}
//         </Button>
//       </div>

//       <Card className="shadow-sm">
//         <Card.Body>
//           {/* Initial Loading Only */}
//           {initialLoading ? (
//             <div className="text-center py-5">
//               <Spinner animation="border" />
//               <p className="mt-3 text-muted">Checking for live class...</p>
//             </div>
//           ) : activeClass ? (
//             // ==================== LIVE CLASS UI ====================
//             <div>
//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <div>
//                   <h5 className="mb-1">{activeClass.title}</h5>
//                   <Badge bg="success" className="px-3 py-2 fs-6">● LIVE NOW</Badge>
//                 </div>
//                 <Button 
//                   variant="danger" 
//                   size="sm"
//                   onClick={() => setActiveClass(null)}
//                 >
//                   Leave Class
//                 </Button>
//               </div>

//               <div 
//                 ref={jitsiRef} 
//                 style={{ 
//                   width: "100%", 
//                   height: "550px", 
//                   borderRadius: "10px",
//                   border: "1px solid #ddd"
//                 }} 
//               />
//             </div>
//           ) : (
//             // ==================== NO LIVE CLASS ====================
//             <div className="text-center py-5">
//               <Alert variant="info">
//                 <p className="mb-1 fw-semibold">No active live class right now.</p>
//                 <p className="mb-0">Your teacher will start the session shortly.</p>
//               </Alert>

//               {allClasses.length > 0 && (
//                 <>
//                   <h6 className="mt-4 mb-3 text-start">Your Upcoming Classes:</h6>
//                   {allClasses.map((cls) => (
//                     <Card key={cls._id} className="mb-3 shadow-sm">
//                       <Card.Body className="d-flex justify-content-between align-items-center">
//                         {/* Left side: Class info */}
//                         <div className="d-flex flex-column flex-grow-1">
//                           <h6 className="mb-1">{cls.title}</h6>
//                           <div className="d-flex gap-3 align-items-center text-muted small">
//                             <div>
//                               <strong>Time:</strong> {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
//                             </div>
//                             <Badge 
//                               bg={cls.status === "live" ? "success" : "danger"} // red for non-live
//                               className="text-capitalize"
//                             >
//                               {cls.status}
//                             </Badge>
//                           </div>
//                         </div>
              
//                         {/* Right side: Join button */}
//                         {cls.status === "live" && (
//                           <Button 
//                             variant="success"
//                             onClick={() => setActiveClass(cls)}
//                           >
//                             Join Live
//                           </Button>
//                         )}
//                       </Card.Body>
//                     </Card>
//                   ))}
//                 </>
//               )}

//               {allClasses.length === 0 && (
//                 <p className="text-muted mt-3">No classes assigned yet.</p>
//               )}
//             </div>
//           )}
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// }