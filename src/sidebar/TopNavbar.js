import React, { useState } from 'react';
import { Navbar, Container, Dropdown, Modal, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { IoSettings } from "react-icons/io5";
import { FaGlobe } from "react-icons/fa";
import { useDispatch } from 'react-redux';
import { logout } from '../redux/Auth/AuthSlice';
import { useTranslation } from 'react-i18next';

const TopNavbar = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language;

  return (
    <>
      <div className="main">

        <Container>

          <div className="twodiv">

            {/* Left */}
            <div className="cmsText">
              <Navbar.Brand className="fw-bold text-primary mb-0">
                <span className="academyText">{t('CMS_TITLE')}</span>
                
              </Navbar.Brand>
            </div>

            {/* Right */}
            <div className="gareandlang">

              <div className="d-flex align-items-center gap-5">

                {/* Language */}
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="light"
                    className="rounded-circle border-0 bg-transparent"
                    style={{ width: '40px', height: '40px' }}
                  >
                    {currentLang === 'en'
                      ? <img src="/Pakistan.svg" alt="Urdu" width="30" />
                      : <img src="/uk.svg" alt="English" width="30" />
                    }

                    <FaGlobe size={24} className="ms-1 d-none d-sm-inline " />
                  </Dropdown.Toggle>

                  <Dropdown.Menu>

                    <Dropdown.Item
                      onClick={() => changeLanguage('en')}
                      className="d-flex align-items-center"
                    >
                      <img src="/uk.svg" alt="logo"  width="20" className="me-2" />
                      English
                    </Dropdown.Item>

                    <Dropdown.Item
                    disabled
                      onClick={() => changeLanguage('fr')}
                      className="d-flex align-items-center"
                    >
                      <img src="/Pakistan.svg" alt="logo"  width="20" className="me-2" />
                      اردو
                    </Dropdown.Item>

                  </Dropdown.Menu>
                </Dropdown>

                {/* Settings */}
                <Dropdown align="end">

                  <Dropdown.Toggle
                    variant="light"
                    className="rounded-circle border-0 bg-transparent"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <IoSettings size={24} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow">

                    <Dropdown.Item
                      as={Link}
                      to="/dashboard/profile"
                    >
                      {t('PROFILE')}
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={() => setShowLogoutModal(true)}
                      className="text-danger"
                    >
                      {t('LOGOUT')}
                    </Dropdown.Item>

                  </Dropdown.Menu>

                </Dropdown>

              </div>

            </div>

          </div>

        </Container>

      </div>

      {/* Logout Modal */}
      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
        size="sm"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('CONFIRM_LOGOUT')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {t('LOGOUT_QUESTION')}
        </Modal.Body>

        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() => setShowLogoutModal(false)}
          >
            {t('NO')}
          </Button>

          <Button
            variant="danger"
            onClick={handleLogout}
          >
            {t('YES_LOGOUT')}
          </Button>

        </Modal.Footer>
      </Modal>

    </>
  );
};

export default TopNavbar;
