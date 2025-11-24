import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { assets } from "../assets";

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      navigate("/register");
    }
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.verifyEmail(userId, otp);
      if (response.data.success) {
        navigate("/login");
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setTimer(60);

    try {
      const response = await authAPI.sendVerifyOtp(userId);
      if (response.data.success) {
        setError("");
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <img src={assets.mail_icon} alt="Email" className="h-16 w-16" />
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Verify Email
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Enter the OTP sent to your email
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength="6"
                className="w-full text-4xl text-center border-2 border-gray-300 rounded-lg px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">Didn't receive OTP?</p>
            <button
              onClick={handleResendOtp}
              disabled={timer > 0 || loading}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50 mt-2"
            >
              {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
