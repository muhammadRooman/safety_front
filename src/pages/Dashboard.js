import axios from "axios";
import React, { useEffect, useState } from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaFilm } from "react-icons/fa6";
import { HiUsers } from "react-icons/hi2";
import {
   FaRedo,FaChalkboardTeacher
} from "react-icons/fa";
const API_BASE = "http://localhost:8082/api";
const Dashboard = () => {
  const { t } = useTranslation(); // 📌 Hook from i18next
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fectchVedios, setFectchVedios] = useState([]);
  const token = useSelector((state) => state.auth.token);


  const fetchVideos = async () => {
    try {
      // role ke hisaab se endpoint choose karo
      const endpoint =
        user?.role === "teacher"
          ? `${API_BASE}/admin/courseVideo`
          : `${API_BASE}/admin/courseVideo/my-videos`;
  
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("!!!", res.data);
      setFectchVedios(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t("error_fetching_user"));
    }
  };
  

  useEffect(() => {
    fetchVideos();
  }, [user?.role]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_ADMIN_API}/auth/userDetails`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response)
      setUser(response.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || t("error_fetching_user"));
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleClick = () => {
    if (user?.role === "teacher") {
      navigate("/dashboard/course-videos");
    } else {
      navigate("/dashboard/my-videos");
    }
  };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)"}}>
      <Container className="py-5">
      
        <Row xs={1} sm={2} md={3} lg={3} xl={4} className="g-4 justify-content-center">
        <Col>
        <Card
        className="dashboard-card h-100"
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        <Card.Body className="text-center">
          <FaFilm size={40} className="mb-2" style={{ color: "rgb(255 204 42)" }} />
          <Card.Title>{t("Total_vedios")}</Card.Title>
          <Card.Text>{t("Total_vedios_tadat")}</Card.Text>
          <Card.Text>{fectchVedios.length}</Card.Text>
        </Card.Body>
      </Card>
      </Col>
          {user?.role === "teacher" && (
            <>
          
              <Col>
                <Card className="dashboard-card h-100" onClick={() => navigate('/dashboard/see_all_teacher_enroll')} style={{ cursor: 'pointer' }}>
                  <Card.Body className="text-center">
                    <FaChalkboardTeacher size={40} className="mb-2" style={{ color: 'rgb(255 204 42)' }} />
                    <Card.Title>{t("enroll_teacher")}</Card.Title>
                    <Card.Text>{t("enroll_teacher_desc")}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
             

              <Col>
                <Card className="dashboard-card h-100" onClick={() => navigate('/dashboard/students_enroll')} style={{ cursor: 'pointer' }}>
                  <Card.Body className="text-center">
                    <HiUsers size={40} className="mb-2" style={{ color: 'rgb(255 204 42)' }} />
                    <Card.Title>{t("enroll_student")}</Card.Title>
                    <Card.Text>{t("enroll_student_desc")}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}

      
          <Col>
            <Card className="dashboard-card h-100" onClick={() => navigate('/dashboard/profile')} style={{ cursor: 'pointer' }}>
              <Card.Body className="text-center">
                <FaRedo size={40} className="mb-2" style={{ color: 'rgb(255 204 42)' }} />
                <Card.Title>{t("reset_password")}</Card.Title>
                <Card.Text>{t("reset_password_desc")}</Card.Text>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>

      
    </div>
  );
};

export default Dashboard;
