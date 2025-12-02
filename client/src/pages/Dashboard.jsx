import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const baseFeatures = [
    {
      icon: "📊",
      title: "Analytics",
      description: "View detailed feedback analytics",
      path: "/analytics",
    },
    {
      icon: "💬",
      title: "Feedback",
      description: "Manage customer feedback",
      path: "/feedback",
    },
    {
      icon: "👥",
      title: "Users",
      description: "Manage team members",
      path: "/users",
    },
    {
      icon: "⚙️",
      title: "Settings",
      description: "Configure your preferences",
      path: "/settings",
    },
  ];

  // Add Admin Dashboard option only for admin users
  const features =
    user?.role === "admin"
      ? [
          ...baseFeatures,
          {
            icon: "🛡️",
            title: "Admin Dashboard",
            description: "System administration & monitoring",
            path: "/admin",
          },
        ]
      : baseFeatures;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar user={user} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Welcome Card */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start">
              <span className="text-5xl mr-4">👋</span>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  Welcome, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 mt-2">
                  You're all set and ready to manage your feedback.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                {user?.name}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user?.isAccountVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user?.isAccountVerified
                    ? "✓ Verified"
                    : "Pending Verification"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200 cursor-pointer hover:scale-105 transform"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm mt-2">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
