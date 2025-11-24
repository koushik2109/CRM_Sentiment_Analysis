import React, { useState } from 'react';
import { auth } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (newPassword.length < 6) {
        setMessage('New password must be at least 6 characters.');
        setLoading(false);
        return;
    }

    try {
      const response = await auth.resetPassword({ email, otp, newPassword }); // POST /api/auth/reset-password
      if (response.data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const formStyle = {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    textAlign: 'center',
  };
  const inputStyle = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxSizing: 'border-box',
  };
  const buttonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#22D172',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={formStyle}>
      <h2>Reset Password</h2>
      {message && <p style={{ color: message.includes('successful') ? '#22D172' : '#FF5A5F' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email (Must match the email used for OTP)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          type="text"
          placeholder="OTP (6-digits)"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={inputStyle}
          maxLength="6"
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={inputStyle}
          required
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '14px' }}>
        <Link to="/login" style={{ color: '#4C83EE' }}>Back to Login</Link>
      </p>
    </div>
  );
};

export default ResetPassword;