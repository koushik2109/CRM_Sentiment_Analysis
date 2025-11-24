// Utility functions for authentication
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password) => {
  return password.length >= 6;
};

export const isValidName = (name) => {
  return name.trim().length >= 2;
};

export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.name) {
    errors.name = "Name is required";
  } else if (!isValidName(formData.name)) {
    errors.name = "Name must be at least 2 characters";
  }

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Invalid email format";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (!isValidPassword(formData.password)) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
};

export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Invalid email format";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  }

  return errors;
};
