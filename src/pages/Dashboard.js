import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { SiGooglemeet } from "react-icons/si";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaFilm, FaRedo, FaChalkboardTeacher, FaVideo, FaAward } from "react-icons/fa";
import { HiUsers } from "react-icons/hi2";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videosCount, setVideosCount] = useState(0);
  const [enrollTeacherCount, setEnrollTeacherCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);

  const token = useSelector((state) => state.auth.token);

  // Fetch user details
  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser(response.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || t("error_fetching_user"));
    }
  }, [token, t]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Fetch Manage Videos count
  const fetchVideosCount = useCallback(async () => {
    try {
      const endpoint =
        user?.role === "teacher"
          ? `${process.env.REACT_APP_BASE_ADMIN_API}/admin/courseVideo`
          : `${process.env.REACT_APP_BASE_ADMIN_API}/admin/courseVideo/my-videos`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVideosCount(res.data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || t("error_fetching_user"));
    }
  }, [token, user?.role, t]);

  // Fetch enroll teacher count
  const fetchEnrollTeacherCount = useCallback(async () => {
    try {
      if (user?.role !== "teacher") return;
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/enrollTeacher`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEnrollTeacherCount(res.data.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || t("error_fetching_user"));
    }
  }, [token, user?.role, t]);

  // Fetch student count
  const fetchStudentsCount = useCallback(async () => {
    try {
      if (user?.role !== "teacher") return;
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/auth/getAllUsers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("asasasasas",res)
      setStudentsCount(res.data.users.length || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || t("error_fetching_user"));
    }
  }, [token, user?.role, t]);

  const fetchCertificatesCount = useCallback(async () => {
    try {
      if (user?.role !== "student") return;
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_ADMIN_API}/admin/certificates/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
          showGlobalLoader: false,
        }
      );
      setCertificatesCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch {
      setCertificatesCount(0);
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (user) {
      fetchVideosCount();
      fetchEnrollTeacherCount();
      fetchStudentsCount();
      fetchCertificatesCount();
    }
  }, [user, fetchVideosCount, fetchEnrollTeacherCount, fetchStudentsCount, fetchCertificatesCount]);

  const handleClick = () => {
    if (user?.role === "teacher") {
      navigate("/dashboard/manage-videos");
    } else {
      navigate("/dashboard/my-videos");
    }
  };

  // fetch all course
  
  return (
    <div className="w-100 dashboard-page">
      <Container className="py-4 py-md-5 px-2 px-sm-3">
        <Row xs={1} sm={2} md={3} lg={3} xl={4} className="g-4 justify-content-center">
          {/* Total Videos */}
          <Col>
            <Card className="dashboard-card h-100" onClick={handleClick} style={{ cursor: "pointer" }}>
              <Card.Body className="text-center">
                <FaFilm size={40} className="mb-2 dashboard-card-icon" />
                <Card.Title>{t("Total_vedios")}</Card.Title>
                <Card.Text>{t("Total_vedios_tadat")}</Card.Text>
                <Card.Text>{videosCount}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
{user?.role === "student" && (
  <>
 <Col>
    <Card
      className="dashboard-card h-100"
      onClick={() => navigate("/dashboard/student_live_class")}
      style={{ cursor: "pointer" }}
    >
      <Card.Body className="text-center">
        <FaVideo size={40} className="mb-2 dashboard-card-icon text-success" />
        <Card.Title>{t("Join Live Class")}</Card.Title>
        <Card.Text>{t("Click here to join your class session.")}</Card.Text>
      </Card.Body>
    </Card>
  </Col>
  <Col>
    <Card
      className="dashboard-card h-100"
      onClick={() => navigate("/dashboard/google-meet")}
      style={{ cursor: "pointer" }}
    >
      <Card.Body className="text-center">
        <SiGooglemeet size={40} className="mb-2 dashboard-card-icon " />
        <Card.Title>{t("Google Meet")}</Card.Title>
        <Card.Text>{t("Click here to join your Live Google Meet Class")}</Card.Text>
      </Card.Body>
    </Card>
  </Col>
  <Col>
    <Card
      className="dashboard-card h-100"
      onClick={() => navigate("/dashboard/my-certificates")}
      style={{ cursor: "pointer" }}
    >
      <Card.Body className="text-center">
        <FaAward size={40} className="mb-2 dashboard-card-icon text-warning" />
        <Card.Title>Certificates</Card.Title>
        <Card.Text>PDF certificates issued by your instructor.</Card.Text>
        <Card.Text>{certificatesCount}</Card.Text>
      </Card.Body>
    </Card>
  </Col>
  </>
 
)}
          {/* Enroll Teacher - Only for teacher */}
          {user?.role === "teacher" && (
            <>
              {/* <Col>
                <Card
                  className="dashboard-card h-100"
                  onClick={() => navigate("/dashboard/see_all_teacher_enroll")}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body className="text-center">
                    <FaChalkboardTeacher size={40} className="mb-2 dashboard-card-icon" />
                    <Card.Title>{t("enroll_teacher")}</Card.Title>
                    <Card.Text>{t("enroll_teacher_desc")}</Card.Text>
                    <Card.Text>{enrollTeacherCount}</Card.Text>
                  </Card.Body>
                </Card>
              </Col> */}

              <Col>
                <Card
                  className="dashboard-card h-100"
                  onClick={() => navigate("/dashboard/students_enroll")}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body className="text-center">
                    <HiUsers size={40} className="mb-2 dashboard-card-icon" />
                    <Card.Title>{t("Students")}</Card.Title>
                    <Card.Text>{t("Total Entroll Students")}</Card.Text>
                    <Card.Text>{studentsCount-1}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card
                  className="dashboard-card h-100"
                  onClick={() => navigate("/dashboard/admin_live_class")}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body className="text-center">
                    <FaVideo size={40} className="mb-2 dashboard-card-icon text-success"/>
                    <Card.Title>{t("Live Class")}</Card.Title>
                    <Card.Text>{t("Admin takes live classes for students.")}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card
                  className="dashboard-card h-100"
                  onClick={() => navigate("/dashboard/certificates")}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body className="text-center">
                    <FaAward size={40} className="mb-2 dashboard-card-icon text-warning" />
                    <Card.Title>Certificates</Card.Title>
                    <Card.Text>Issue PDF certificates to students.</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}

          {/* Reset Password */}
          {/* <Col>
            <Card className="dashboard-card h-100" onClick={() => navigate("/dashboard/profile")} style={{ cursor: "pointer" }}>
              <Card.Body className="text-center">
                <FaRedo size={40} className="mb-2 dashboard-card-icon" />
                <Card.Title>{t("reset_password")}</Card.Title>
                <Card.Text>{t("reset_password_desc")}</Card.Text>
              </Card.Body>
            </Card>
          </Col> */}
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;