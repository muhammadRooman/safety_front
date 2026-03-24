import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div style={styles.container}>
      {/* Blur background blocker */}
      <div style={styles.blurOverlay}></div>

      {/* Center content */}
      <div style={styles.card}>
        <div style={styles.emoji}>😢</div>
        <h1 style={styles.title}>404</h1>
        <p style={styles.description}>Oops! The page you are looking for doesn’t exist.</p>
        <button style={styles.button} onClick={goBack}>⬅ Go Back</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: `'Poppins', sans-serif`,
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    zIndex: 9999,
    overflow: 'hidden',
  },
  blurOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backdropFilter: 'blur(12px)',
    background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
    pointerEvents: 'all',
    zIndex: 1,
  },
  card: {
    pointerEvents: 'auto',
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 2,
    transform: 'translate(-50%, -50%)',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    padding: '40px 30px',
    color: '#001f3f', // dark blue
    textAlign: 'center',
    backdropFilter: 'blur(25px)',
    boxShadow: '0 0 25px rgba(0,0,0,0.3)',
    animation: 'fadeIn 1s ease-in-out',
    width: '90%',
    maxWidth: '400px',
  },
  emoji: {
    fontSize: '4rem',
    marginBottom: '10px',
  },
  title: {
    fontSize: '4.5rem',
    margin: '0',
    fontWeight: '700',
    letterSpacing: '2px',
    textShadow: '2px 2px 10px rgba(0,0,0,0.1)',
  },
  description: {
    fontSize: '1.2rem',
    margin: '15px 0 30px',
    color: '#001f3f', // dark blue
  },
  button: {
    padding: '12px 30px',
    fontSize: '1.1rem',
    borderRadius: '50px',
    border: 'none',
    background: 'linear-gradient(to right, #6dd5fa, #2980b9)', // light blue
    color: '#fff',
    cursor: 'pointer',
    transition: '0.3s ease all',
    boxShadow: '0 5px 15px rgba(41, 128, 185, 0.4)',
  },
};

// CSS animation injection
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
`;
document.head.appendChild(style);

export default NotFound;
