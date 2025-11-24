import React, { useState } from 'react';
import { auth } from '../services/api';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const response = await auth.sendResetOtp({ email }); // POST /api/auth/send-reset-otp
      if (response.data.success) {
        setMessage(response.data.message + ' Check your email for the OTP.');
        setSuccess(true);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP.');
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
    backgroundColor: '#4C83EE',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={formStyle}>
      <h2>Forgot Password</h2>
      <p style={{marginBottom: '20px'}}>Enter your email to receive a password reset OTP.</p>
      {message && <p style={{ color: success ? '#22D172' : '#FF5A5F' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
      <p style={{ marginTop: '20px', fontSize: '14px' }}>
        <Link to="/reset-password" style={{ color: '#4C83EE' }}>I have the OTP</Link>
      </p>
      <p style={{ marginTop: '5px', fontSize: '14px' }}>
        <Link to="/login" style={{ color: '#4C83EE' }}>Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;