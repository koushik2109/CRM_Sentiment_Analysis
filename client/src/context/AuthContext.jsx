import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI } from "../services/api";
import Cookie from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.isAuthenticated();
        if (response.data.success) {
          setIsAuthenticated(true);
          // Fetch user data if available
          const userId = Cookie.get("userId");
          if (userId) {
            const userData = await userAPI.getUserData(userId);
            if (userData.data.success) {
              setUser(userData.data.userData);
            }
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        setIsAuthenticated(true);
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      Cookie.remove("token");
      Cookie.remove("userId");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
