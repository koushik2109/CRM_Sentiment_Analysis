// Constants for the application
export const API_TIMEOUT = 10000; // 10 seconds
export const OTP_LENGTH = 6;
export const PASSWORD_MIN_LENGTH = 6;
export const OTP_VALIDITY_MINUTES = 15;

export const MESSAGES = {
  // Success messages
  SUCCESS_REGISTER: "Registration successful! Please verify your email.",
  SUCCESS_LOGIN: "Login successful!",
  SUCCESS_LOGOUT: "Logged out successfully!",
  SUCCESS_EMAIL_VERIFIED: "Email verified successfully!",
  SUCCESS_PASSWORD_RESET: "Password reset successful! Please login.",
  SUCCESS_OTP_SENT: "OTP sent to your email!",

  // Error messages
  ERROR_NETWORK: "Network error. Please check your connection.",
  ERROR_INVALID_OTP: "Invalid OTP. Please try again.",
  ERROR_OTP_EXPIRED: "OTP has expired. Please request a new one.",
  ERROR_INVALID_EMAIL: "Invalid email address.",
  ERROR_INVALID_PASSWORD: "Invalid password.",
  ERROR_USER_EXISTS: "User already exists with this email.",
  ERROR_USER_NOT_FOUND: "User not found.",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
};
