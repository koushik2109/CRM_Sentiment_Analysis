import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { Navigate } from 'react-router-dom';

const VerifyAccount = () => {
  const { userData, checkAuth } = useAuth();
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user is already verified in context, redirect to dashboard
  if (userData && userData.isAccountVerified) {
    return <Navigate to="/" />; 
  }

  const handleSendOtp = async () => {
    if (!userData?.userId) {
        setMessage("User ID not available. Please log in again.");
        return;
    }
    setLoading(true);
    setMessage('');
    try {
      // POST /api/auth/send-verify-otp - uses userId from context (cookie)
      const response = await auth.sendVerifyOtp(userData.userId); 
      if (response.data.success) {
        setMessage('Verification OTP sent to your email!');
        setOtpSent(true);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP.');
    } finally {
        setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // POST /api/auth/verify-account
      const response = await auth.verifyEmail({ userId: userData.userId, otp }); 
      if (response.data.success) {
        setMessage('Email Verified Successfully! Redirecting...');
        await checkAuth(); // Update global state
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Verification failed.');
    } finally {
        setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    textAlign: 'center',
    background: '#fff'
  };

  const buttonStyle = (color) => ({
    padding: '10px 20px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
    opacity: loading ? 0.7 : 1,
  });

  return (
    <div style={containerStyle}>
      <h2>Email Verification</h2>
      {message && <p style={{ color: message.includes('Success') ? '#22D172' : '#FF5A5F' }}>{message}</p>}
      
      {!otpSent ? (
        <>
          <p>Your account ({userData?.email}) is unverified. Click below to receive an OTP.</p>
          <button onClick={handleSendOtp} style={buttonStyle('#4C83EE')} disabled={loading}>
            {loading ? 'Sending...' : 'Send Verification OTP'}
          </button>
        </>
      ) : (
        <form onSubmit={handleVerify}>
          <p>Please enter the 6-digit OTP sent to {userData?.email}:</p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ padding: '10px', margin: '10px', width: '200px', borderRadius: '5px', border: '1px solid #ccc' }}
            maxLength="6"
            required
          />
          <button type="submit" style={buttonStyle('#22D172')} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          <p style={{marginTop: '15px'}}><span style={{cursor: 'pointer', color: '#4C83EE'}} onClick={handleSendOtp}>Resend OTP</span></p>
        </form>
      )}
    </div>
  );
};

export default VerifyAccount;