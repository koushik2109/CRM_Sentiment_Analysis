import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assets } from '../assets/assets';

const Header = () => {
  const { isAuth, logoutUser, userData } = useAuth();

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    marginBottom: '30px',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: '#4C83EE',
    margin: '0 10px',
    fontWeight: '600',
  };

  const buttonStyle = {
    padding: '8px 15px',
    backgroundColor: '#FF5A5F',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <img src={assets.logo} alt="Logo" style={{ height: '30px', marginRight: '10px' }} />
        <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>AI CRM</span>
      </Link>
      
      <div>
        {!isAuth ? (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={linkStyle}>Register</Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: '15px', color: '#555', fontSize: '0.9em' }}>Hello, {userData?.name || 'User'}</span>
            <button onClick={logoutUser} style={buttonStyle}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;