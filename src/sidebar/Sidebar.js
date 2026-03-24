import React, { useState, useEffect, useRef } from 'react';
import { Nav, Modal } from 'react-bootstrap';
import { io } from "socket.io-client";
import { SiGooglemeet } from "react-icons/si";
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  FaSignOutAlt,
  FaTachometerAlt,
  FaChalkboardTeacher,
  FaFilm,
  FaUserCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import { HiUsers } from 'react-icons/hi2';
import { logout } from '../redux/Auth/AuthSlice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { LuNotebookPen } from "react-icons/lu";

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.token);
  const studentId = useSelector((state) => state.auth.id);

  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8082";

  const sidebarRef = useRef(null);
  const hamburgerBtnRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        toast.error(err.response?.data?.message || t('ERROR_FETCHING_USER'));
      }
    };
    if (token) fetchUser();
  }, [token, t]);

  // Socket listener for global message alerts (admin & student)
  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    if (user?.role === "teacher") {
      s.emit("join-admin");
    }

    if (user?.role === "student" && studentId) {
      // As soon as student is logged in (id available) mark them online
      s.emit("join-student", { studentId });

      // Student: also listen for receive-message so alerts work even if student-alert misses
      s.on("receive-message", (msg) => {
        if (!msg || String(msg.to) !== String(studentId)) return;
        try {
          const stored = localStorage.getItem(`studentMessages_${studentId}`);
          const arr = stored ? JSON.parse(stored) : [];
          const nextList = [...(Array.isArray(arr) ? arr : []), msg];
          const limited =
            nextList.length > 100
              ? nextList.slice(nextList.length - 100)
              : nextList;
          localStorage.setItem(
            `studentMessages_${studentId}`,
            JSON.stringify(limited)
          );
          localStorage.setItem(
            `studentMessagesAlert_${studentId}`,
            "true"
          );
        } catch (e) {
          console.error("Failed to handle receive-message for student in sidebar", e);
        }
      });
    }

    // When student sends message -> admin gets alert
    s.on("admin-alert", (alert) => {
      if (!alert || !alert.from) return;
      try {
        // Also store latest message into adminMessages cache so it appears when opening Messages page
        const adminStored = localStorage.getItem("adminMessages");
        const adminObj = adminStored ? JSON.parse(adminStored) : {};
        const fromId = String(alert.from);
        const msgObj = {
          from: fromId,
          to: "admin",
          message: alert.message || "",
          createdAt: new Date().toISOString(),
        };
        const prevList = adminObj[fromId] || [];
        const nextList = [...prevList, msgObj];
        adminObj[fromId] =
          nextList.length > 100 ? nextList.slice(nextList.length - 100) : nextList;
        localStorage.setItem("adminMessages", JSON.stringify(adminObj));

        const stored = localStorage.getItem("adminMessagesUnread");
        const obj = stored ? JSON.parse(stored) : {};
        obj[fromId] = (obj[fromId] || 0) + 1;
        localStorage.setItem("adminMessagesUnread", JSON.stringify(obj));

        const total = Object.values(obj).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
      } catch (e) {
        console.error("Failed to handle admin-alert in sidebar", e);
      }
    });

    // When admin sends message -> student gets alert
    s.on("student-alert", (alert) => {
      if (!studentId) return;
      try {
        const studentStored = localStorage.getItem(`studentMessages_${studentId}`);
        const arr = studentStored ? JSON.parse(studentStored) : [];
        const msgObj = {
          from: "admin",
          to: studentId,
          message: alert?.message || "",
          createdAt: new Date().toISOString(),
        };
        const nextList = [...(Array.isArray(arr) ? arr : []), msgObj];
        const limited =
          nextList.length > 100 ? nextList.slice(nextList.length - 100) : nextList;
        localStorage.setItem(`studentMessages_${studentId}`, JSON.stringify(limited));

        localStorage.setItem(
          `studentMessagesAlert_${studentId}`,
          "true"
        );
      } catch (e) {
        console.error("Failed to handle student-alert in sidebar", e);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [SOCKET_URL, token, user?.role, studentId]);

  // Close on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideSidebar =
        sidebarRef.current && sidebarRef.current.contains(e.target);
      const clickedHamburgerBtn =
        hamburgerBtnRef.current && hamburgerBtnRef.current.contains(e.target);

      if (!clickedInsideSidebar && !clickedHamburgerBtn && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Lock body scroll when sidebar is open (mobile UX)
  useEffect(() => {
    if (isOpen) document.body.classList.add('no-scroll');
    else document.body.classList.remove('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [isOpen]);

  // Helper to close sidebar
  const closeSidebar = () => setIsOpen(false);

  const confirmLogout = () => {
    localStorage.clear();
    dispatch(logout());
    navigate('/login');
    setShowLogoutModal(false);
    closeSidebar();
  };

  return (
    <>
      {/* Hamburger / Cross Button */}
      <button
        ref={hamburgerBtnRef}
        className="hamburger-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Backdrop - disables background clicks */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-header">
          <img
            src="/OHS3.png"
            alt="OHS Academy Logo"
            className="sidebar-logo"
          />
        </div>

        <div className="sidebar-role text-center mb-4">
          <div className="role-chip d-inline-flex align-items-center gap-2">
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#28a745",
                boxShadow: "0 0 4px rgba(40,167,69,0.8)",
              }}
            />
            <FaUserCircle size={22} className="me-1" />
            <span>
              {user?.role === 'teacher'
                ? t('Admin')
                : user?.role === 'student'
                ? 'Student'
                : t('Admin')}
            </span>
          </div>
        </div>

        <hr className="sidebar-divider" />

        <Nav className="flex-column gap-2 px-2">
          <Nav.Link
            as={Link}
            to="/dashboard"
            className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeSidebar}   // ← close on click
          >
            <FaTachometerAlt size={25} className="me-3" /> {t('DASHBOARD')}
          </Nav.Link>

          {user?.role === 'teacher' && (
            <>
              <Nav.Link
                as={Link}
                to="/dashboard/students_enroll"
                className={`sidebar-link ${isActive('/dashboard/students_enroll') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <HiUsers size={25} className="me-3" /> {t('Students')}
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/dashboard/course-videos"
                className={`sidebar-link ${isActive('/dashboard/course-videos') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FaFilm className="me-3" /> {t('COURSE_VIDEOS')}
              </Nav.Link>
{/**
              <Nav.Link
                as={Link}
                to="/dashboard/ohs_course_manage"
                className={`sidebar-link ${isActive('/dashboard/ohs_course_manage') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LuNotebookPen  size={25} className="me-3" /> Manage Courses
              </Nav.Link>
*/}
              {
                /**   // <Nav.Link
              //   as={Link}
              //   to="/dashboard/contact_us"
              //   className={`sidebar-link ${isActive('/dashboard/contact_us') ? 'active' : ''}`}
              //   onClick={closeSidebar}
              // >
              //   <LuMessageSquareText size={25} className="me-3" /> {t('Contect_us')}
              // </Nav.Link> */
              }
            

              <Nav.Link
                as={Link}
                to="/dashboard/see_all_teacher_enroll"
                className={`sidebar-link ${isActive('/dashboard/see_all_teacher_enroll') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FaChalkboardTeacher size={25} className="me-3" /> {t('TEACHERS')}
              </Nav.Link>
{/** 
  
 
              <Nav.Link
                as={Link}
                to="/dashboard/messages"
                className={`sidebar-link ${isActive('/dashboard/messages') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LuMessageSquareText size={25} className="me-3" />
                {t('Messages')}
                {!isActive('/dashboard/messages') && adminUnreadTotal > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="ms-2"
                    style={{ fontSize: '0.65rem', minWidth: 18 }}
                  >
                    {adminUnreadTotal > 99 ? '99+' : adminUnreadTotal}
                  </Badge>
                )}
              </Nav.Link>
 */}
              <Nav.Link
                as={Link}
                to="/dashboard/teacher-info"
                className={`sidebar-link ${isActive('/dashboard/teacher-info') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FaInfoCircle size={22} className="me-3" /> Teacher Info
              </Nav.Link>


            </>
          )}

          {user?.role === 'student' && (
            <>
              <Nav.Link
                as={Link}
                to="/dashboard/my-videos"
                className={`sidebar-link ${isActive('/dashboard/my-videos') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FaFilm size={25} className="me-3" /> {t('MY_VIDEOS')}
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/dashboard/google-meet"
                className={`sidebar-link ${isActive('/dashboard/google-meet') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <SiGooglemeet size={25} className="me-3" /> {t('Google Meet')}
              </Nav.Link>

              <Nav.Link
                as={Link}
                to="/dashboard/ohs_course"
                className={`sidebar-link ${isActive('/dashboard/ohs_course') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LuNotebookPen size={25} className="me-3" /> {t('ohs_course')}
              </Nav.Link>
 {/** 
              <Nav.Link
                as={Link}
                to="/dashboard/student-chat"
                className={`sidebar-link ${isActive('/dashboard/student-chat') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <LuMessageSquareText size={25} className="me-3" />
                {t('Messages')}
                {!isActive('/dashboard/student-chat') && studentHasAlert && (
                  <Badge
                    bg="danger"
                    pill
                    className="ms-2"
                    style={{ fontSize: '0.65rem', minWidth: 10 }}
                  >
                    !
                  </Badge>
                )}
              </Nav.Link>
*/}
              <Nav.Link
                as={Link}
                to="/dashboard/teacher-info"
                className={`sidebar-link ${isActive('/dashboard/teacher-info') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <FaInfoCircle size={22} className="me-3" /> Teacher Info
              </Nav.Link>
            </>
          )}

          <Nav.Link
            onClick={() => {
              setShowLogoutModal(true);
              closeSidebar();  // close sidebar before showing modal
            }}
            className="sidebar-link logout-btn mt-4 w-100"
          >
            <FaSignOutAlt className="me-3" /> {t('LOGOUT')}
          </Nav.Link>
        </Nav>
      </div>

      {/* Logout Modal */}
      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('CONFIRM_LOGOUT')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('LOGOUT_CONFIRM_TEXT')}</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
            {t('CANCEL')}
          </button>
          <button className="btn btn-danger" onClick={confirmLogout}>
            {t('YES_LOGOUT')}
          </button>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default Sidebar;