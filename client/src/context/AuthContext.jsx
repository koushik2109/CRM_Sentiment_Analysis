import { createContext, useContext, useState, useEffect, useRef } from "react";
import { authAPI, userAPI } from "../services/api";
import Cookie from "js-cookie";

const AuthContext = createContext();

// Heartbeat interval (every 30 seconds)
const HEARTBEAT_INTERVAL = 30000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const heartbeatRef = useRef(null);

  // Heartbeat to keep user marked as online
  useEffect(() => {
    if (isAuthenticated) {
      // Send initial heartbeat
      userAPI.heartbeat().catch(() => {});

      // Set up interval for periodic heartbeats
      heartbeatRef.current = setInterval(() => {
        userAPI.heartbeat().catch(() => {});
      }, HEARTBEAT_INTERVAL);
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [isAuthenticated]);

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
        // Store userId and fetch user data
        if (response.data.userId) {
          Cookie.set("userId", response.data.userId, { expires: 7 });
          const userData = await userAPI.getUserData(response.data.userId);
          if (userData.data.success) {
            setUser(userData.data.userData);
          }
        }
        // Return full response including role and isAdmin
        return {
          success: true,
          role: response.data.role,
          isAdmin: response.data.isAdmin,
          userId: response.data.userId,
        };
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
        // User is logged in after registration (token cookie is set by backend)
        setIsAuthenticated(true);
        if (response.data.userId) {
          Cookie.set("userId", response.data.userId, { expires: 7 });
        }
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
    setIsAuthenticated(true);
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
        setIsAuthenticated,
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
