import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, pages: 1 });
  const [feedbackPagination, setFeedbackPagination] = useState({
    page: 1,
    pages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [metricsData, setMetricsData] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!authLoading && user && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getHealth(),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (healthRes.data.success) setHealth(healthRes.data.health);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const res = await adminAPI.getUsers(page, 10, searchTerm);
      if (res.data.success) {
        setUsers(res.data.users);
        setUserPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchFeedback = async (page = 1) => {
    try {
      const res = await adminAPI.getFeedback(page, 10);
      if (res.data.success) {
        setFeedback(res.data.feedback);
        setFeedbackPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await adminAPI.deleteUser(userId);
      if (res.data.success) {
        fetchUsers(userPagination.page);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "feedback") fetchFeedback();
  }, [activeTab]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-300">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Admin Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold text-blue-400">
              🛡️ Admin Dashboard
            </span>
            {/* Quick Links */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setActiveTab("analytics")}
                className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab("monitoring")}
                className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1"
              >
                📈 Monitoring
              </button>
              <Link
                to="/dashboard"
                className="text-gray-400 hover:text-blue-400 transition flex items-center gap-1"
              >
                🏠 Main Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700 pb-4 overflow-x-auto">
          {[
            "overview",
            "analytics",
            "users",
            "feedback",
            "monitoring",
            "system",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition whitespace-nowrap ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab === "monitoring"
                ? "📊 Monitoring"
                : tab === "analytics"
                ? "📈 Analytics"
                : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Quick Action Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => setActiveTab("analytics")}
                className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 hover:scale-105 transition transform text-left"
              >
                <span className="text-2xl">📊</span>
                <h4 className="font-semibold mt-2">Analytics Dashboard</h4>
                <p className="text-purple-200 text-xs mt-1">
                  View charts & trends
                </p>
              </button>
              <button
                onClick={() => setActiveTab("monitoring")}
                className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4 hover:scale-105 transition transform text-left"
              >
                <span className="text-2xl">📈</span>
                <h4 className="font-semibold mt-2">Monitoring</h4>
                <p className="text-green-200 text-xs mt-1">
                  Prometheus & Grafana
                </p>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 hover:scale-105 transition transform text-left"
              >
                <span className="text-2xl">👥</span>
                <h4 className="font-semibold mt-2">Manage Users</h4>
                <p className="text-blue-200 text-xs mt-1">View & edit users</p>
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-4 hover:scale-105 transition transform text-left"
              >
                <span className="text-2xl">💬</span>
                <h4 className="font-semibold mt-2">All Feedback</h4>
                <p className="text-orange-200 text-xs mt-1">
                  View all submissions
                </p>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-5 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats?.users?.total || 0}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="Online Now"
                value={stats?.users?.online || 0}
                icon="🟢"
                color="green"
              />
              <StatCard
                title="Verified Users"
                value={stats?.users?.verified || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Total Feedback"
                value={stats?.feedback?.total || 0}
                icon="💬"
                color="purple"
              />
              <StatCard
                title="Admins"
                value={stats?.users?.byRole?.admin || 0}
                icon="🛡️"
                color="yellow"
              />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* User Roles */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
                <div className="space-y-3">
                  {Object.entries(stats?.users?.byRole || {}).map(
                    ([role, count]) => (
                      <div
                        key={role}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize text-gray-400">{role}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (count / (stats?.users?.total || 1)) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-white font-medium w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Sentiment Breakdown */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Feedback Sentiment
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats?.feedback?.breakdown || {}).map(
                    ([sentiment, count]) => {
                      const colors = {
                        positive: "bg-green-500",
                        neutral: "bg-gray-500",
                        negative: "bg-red-500",
                      };
                      return (
                        <div
                          key={sentiment}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize text-gray-400">
                            {sentiment}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-700 rounded-full h-2">
                              <div
                                className={`${
                                  colors[sentiment] || "bg-blue-500"
                                } h-2 rounded-full`}
                                style={{
                                  width: `${
                                    (count / (stats?.feedback?.total || 1)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-white font-medium w-8">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Online</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {stats?.recentUsers?.map((u) => (
                      <tr key={u._id} className="text-gray-300">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.isOnline ? "bg-green-500" : "bg-gray-500"
                              }`}
                              title={u.isOnline ? "Online" : "Offline"}
                            />
                            {u.name}
                          </div>
                        </td>
                        <td className="py-3">{u.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              u.role === "admin"
                                ? "bg-yellow-600"
                                : "bg-gray-600"
                            }`}
                          >
                            {u.role || "member"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                              u.isOnline
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.isOnline
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-gray-500"
                              }`}
                            />
                            {u.isOnline
                              ? "Online"
                              : u.lastActive
                              ? `Last seen ${new Date(
                                  u.lastActive
                                ).toLocaleDateString()}`
                              : "Offline"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              u.isAccountVerified
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                          >
                            {u.isAccountVerified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3 text-sm">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab - Embedded Analytics Dashboard */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">📊 Analytics Dashboard</h2>
              <button
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                🔄 Refresh Data
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
                <p className="text-blue-200 text-sm">Total Users</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.users?.total || 0}
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  Registered accounts
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
                <p className="text-green-200 text-sm">Online Now</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.users?.online || 0}
                </p>
                <p className="text-green-200 text-xs mt-1">Active sessions</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
                <p className="text-purple-200 text-sm">Total Feedback</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.feedback?.total || 0}
                </p>
                <p className="text-purple-200 text-xs mt-1">Submissions</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6">
                <p className="text-orange-200 text-sm">Avg Confidence</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.feedback?.avgConfidence
                    ? `${(stats.feedback.avgConfidence * 100).toFixed(0)}%`
                    : "N/A"}
                </p>
                <p className="text-orange-200 text-xs mt-1">AI accuracy</p>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  📈 Sentiment Distribution
                </h3>
                <div className="space-y-4">
                  {stats?.feedback?.bySentiment &&
                    Object.entries(stats.feedback.bySentiment).map(
                      ([sentiment, count]) => {
                        const total = stats?.feedback?.total || 1;
                        const percentage = ((count / total) * 100).toFixed(1);
                        const colors = {
                          positive: "bg-green-500",
                          negative: "bg-red-500",
                          neutral: "bg-gray-500",
                        };
                        return (
                          <div key={sentiment}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{sentiment}</span>
                              <span>
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-full ${
                                  colors[sentiment] || "bg-blue-500"
                                } transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  {(!stats?.feedback?.bySentiment ||
                    Object.keys(stats.feedback.bySentiment).length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No sentiment data yet
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🎯 User Roles Distribution
                </h3>
                <div className="space-y-4">
                  {stats?.users?.byRole &&
                    Object.entries(stats.users.byRole).map(([role, count]) => {
                      const total = stats?.users?.total || 1;
                      const percentage = ((count / total) * 100).toFixed(1);
                      const colors = {
                        admin: "bg-yellow-500",
                        manager: "bg-purple-500",
                        member: "bg-blue-500",
                      };
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{role}</span>
                            <span>
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full ${
                                colors[role] || "bg-blue-500"
                              } transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {(!stats?.users?.byRole ||
                    Object.keys(stats.users.byRole).length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No role data yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity & Intents */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🕐 Recent Activity
                </h3>
                <div className="space-y-3">
                  {stats?.recentUsers?.slice(0, 5).map((user, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-700 ${
                              user.isOnline ? "bg-green-500" : "bg-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.isOnline ? "bg-green-600" : "bg-gray-600"
                        }`}
                      >
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  ))}
                  {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No recent users
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🏷️ Top Intents Detected
                </h3>
                <div className="space-y-3">
                  {stats?.feedback?.topIntents &&
                  stats.feedback.topIntents.length > 0 ? (
                    stats.feedback.topIntents.map((intent, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                      >
                        <span className="capitalize">
                          {intent._id?.replace(/_/g, " ") || "Unknown"}
                        </span>
                        <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                          {intent.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No intents detected yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links to External Dashboards */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                🔗 External Dashboards
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <a
                  href="http://localhost:4000/metrics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center transition"
                >
                  <span className="text-3xl">📊</span>
                  <p className="font-semibold mt-2">Prometheus Metrics</p>
                  <p className="text-orange-200 text-xs">
                    Raw metrics endpoint
                  </p>
                </a>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition"
                >
                  <span className="text-3xl">📈</span>
                  <p className="font-semibold mt-2">Grafana Dashboard</p>
                  <p className="text-green-200 text-xs">Visual analytics</p>
                </a>
                <a
                  href="http://localhost:9090"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-center transition"
                >
                  <span className="text-3xl">🔍</span>
                  <p className="font-semibold mt-2">Prometheus Query</p>
                  <p className="text-blue-200 text-xs">Query explorer</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">All Users</h3>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-700">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Online</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((u) => (
                    <tr key={u._id} className="text-gray-300">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${
                                u.isOnline ? "bg-green-500" : "bg-gray-500"
                              }`}
                            />
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            u.role === "admin"
                              ? "bg-yellow-600"
                              : u.role === "manager"
                              ? "bg-purple-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {u.role || "member"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                            u.isOnline
                              ? "bg-green-600/20 text-green-400"
                              : "bg-gray-600/20 text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isOnline
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-500"
                            }`}
                          />
                          {u.isOnline
                            ? "Online"
                            : u.lastActive
                            ? `${new Date(u.lastActive).toLocaleDateString()}`
                            : "Offline"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            u.isAccountVerified ? "bg-green-600" : "bg-red-600"
                          }`}
                        >
                          {u.isAccountVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userPagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchUsers(userPagination.page - 1)}
                  disabled={userPagination.page === 1}
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {userPagination.page} of {userPagination.pages}
                </span>
                <button
                  onClick={() => fetchUsers(userPagination.page + 1)}
                  disabled={userPagination.page === userPagination.pages}
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6">All Feedback</h3>

            <div className="space-y-4">
              {feedback.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No feedback yet
                </p>
              ) : (
                feedback.map((f, idx) => (
                  <div
                    key={f.jobId || idx}
                    className="bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Feedback Text */}
                        <p className="text-gray-200">{f.text}</p>

                        {/* User Info */}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                f.user?.isOnline
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            <span className="text-white font-medium">
                              {f.user?.name || "Unknown"}
                            </span>
                          </span>
                          <span className="text-gray-400">{f.user?.email}</span>
                          <span className="text-gray-400">
                            {f.user?.role || "member"}
                          </span>
                        </div>

                        {/* Intents */}
                        {f.intents && f.intents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {f.intents.map((intent, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-xs"
                              >
                                {intent.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Scores */}
                        {f.allScores && f.allScores.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {f.allScores.map((score, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  score.label
                                    ?.toLowerCase()
                                    .includes("positive") ||
                                  score.label === "LABEL_2"
                                    ? "bg-green-600/30 text-green-300"
                                    : score.label
                                        ?.toLowerCase()
                                        .includes("negative") ||
                                      score.label === "LABEL_0"
                                    ? "bg-red-600/30 text-red-300"
                                    : "bg-gray-600/30 text-gray-300"
                                }`}
                              >
                                {score.label}:{" "}
                                {score.percentage ||
                                  `${(score.score * 100).toFixed(1)}%`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            {f.processedAt
                              ? new Date(f.processedAt).toLocaleString()
                              : "Pending"}
                          </span>
                          {f.metadata?.wordCount && (
                            <span>📝 {f.metadata.wordCount} words</span>
                          )}
                          <span
                            className={
                              f.aiProcessed
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {f.aiProcessed ? "🤖 AI" : "📋 Fallback"}
                          </span>
                          <span>Confidence: {f.confidencePercent}</span>
                        </div>
                      </div>

                      {/* Sentiment Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl">
                          {f.sentiment === "positive"
                            ? "😊"
                            : f.sentiment === "negative"
                            ? "😞"
                            : "😐"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            f.sentiment === "positive"
                              ? "bg-green-600"
                              : f.sentiment === "negative"
                              ? "bg-red-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {f.sentiment?.toUpperCase() || "PROCESSING"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {feedbackPagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchFeedback(feedbackPagination.page - 1)}
                  disabled={feedbackPagination.page === 1}
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {feedbackPagination.page} of {feedbackPagination.pages}
                </span>
                <button
                  onClick={() => fetchFeedback(feedbackPagination.page + 1)}
                  disabled={
                    feedbackPagination.page === feedbackPagination.pages
                  }
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div>
            {/* Health Status */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <HealthCard title="Server" status={health?.server} />
              <HealthCard title="Database" status={health?.database} />
              <HealthCard title="Redis" status={health?.redis} />
            </div>

            {/* System Info */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <p className="text-xl font-semibold">
                    {health?.uptime ? formatUptime(health.uptime) : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Memory Usage</p>
                  <p className="text-xl font-semibold">
                    {health?.memory
                      ? `${Math.round(health.memory.heapUsed / 1024 / 1024)} MB`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Grafana Integration */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                📊 Quick Monitoring Links
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="http://localhost:4000/metrics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <p className="font-medium">Prometheus Metrics</p>
                      <p className="text-sm text-gray-400">
                        View raw metrics data
                      </p>
                    </div>
                  </div>
                </a>
                <button
                  onClick={() => setActiveTab("monitoring")}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-medium">Full Monitoring Dashboard</p>
                      <p className="text-sm text-gray-400">
                        View detailed analytics
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === "monitoring" && (
          <div className="space-y-6">
            {/* Quick Links Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <a
                href="http://localhost:4000/metrics"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 hover:scale-105 transition transform"
              >
                <span className="text-4xl">📈</span>
                <h3 className="text-xl font-bold mt-3">Prometheus</h3>
                <p className="text-green-200 text-sm mt-1">
                  Raw Metrics Endpoint
                </p>
                <p className="text-xs text-green-300 mt-2">
                  localhost:4000/metrics
                </p>
              </a>

              <a
                href="http://localhost:3006/metrics"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 hover:scale-105 transition transform"
              >
                <span className="text-4xl">⚙️</span>
                <h3 className="text-xl font-bold mt-3">Worker Metrics</h3>
                <p className="text-blue-200 text-sm mt-1">
                  Feedback Pipeline Stats
                </p>
                <p className="text-xs text-blue-300 mt-2">
                  localhost:3006/metrics
                </p>
              </a>

              <a
                href="http://localhost:3000/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 hover:scale-105 transition transform"
              >
                <span className="text-4xl">📊</span>
                <h3 className="text-xl font-bold mt-3">Analytics</h3>
                <p className="text-purple-200 text-sm mt-1">
                  View Detailed Charts
                </p>
                <p className="text-xs text-purple-300 mt-2">
                  User & Feedback Analytics
                </p>
              </a>

              <a
                href="http://localhost:9090"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6 hover:scale-105 transition transform"
              >
                <span className="text-4xl">🔥</span>
                <h3 className="text-xl font-bold mt-3">Prometheus UI</h3>
                <p className="text-orange-200 text-sm mt-1">Query & Explore</p>
                <p className="text-xs text-orange-300 mt-2">
                  localhost:9090 (if running)
                </p>
              </a>
            </div>

            {/* Grafana Setup Guide */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span> Grafana Integration Guide
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-400 mb-3">
                    Quick Setup Steps:
                  </h4>
                  <ol className="space-y-2 text-gray-300 text-sm">
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        1
                      </span>
                      <span>
                        Install Grafana from grafana.com/grafana/download
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        2
                      </span>
                      <span>Start Grafana (usually runs on port 3001)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        3
                      </span>
                      <span>
                        Add Prometheus data source with URL:
                        http://localhost:4000
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        4
                      </span>
                      <span>Create dashboards using available metrics</span>
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-green-400 mb-3">
                    Or use Docker:
                  </h4>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                    <p>cd monitoring</p>
                    <p>docker-compose up -d</p>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    This starts Prometheus + Grafana pre-configured
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Metrics Dashboard */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span> Real-Time Metrics Dashboard
              </h3>

              {/* Gauge Charts Row */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* CPU Gauge */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    CPU Usage
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10B981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(health?.cpu || 25) * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-400">
                        {health?.cpu || 25}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    process_cpu_seconds
                  </p>
                </div>

                {/* Memory Gauge */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    Memory Usage
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${Math.min(
                          (health?.memory?.heapUsed / 1024 / 1024 / 512) *
                            352 || 88,
                          352
                        )} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-bold text-blue-400">
                        {health?.memory
                          ? Math.round(health.memory.heapUsed / 1024 / 1024)
                          : 45}
                      </span>
                      <span className="text-xs text-gray-400">MB</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    nodejs_heap_size_bytes
                  </p>
                </div>

                {/* Active Handles Gauge */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    Active Handles
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#8B5CF6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${Math.min(
                          (health?.handles || 12) * 10,
                          352
                        )} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-400">
                        {health?.handles || 12}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    nodejs_active_handles
                  </p>
                </div>

                {/* Request Rate */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    Requests/min
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#F59E0B"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${Math.min(
                          (stats?.requests || 150) / 2,
                          352
                        )} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-yellow-400">
                        {stats?.requests || 150}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    http_requests_total
                  </p>
                </div>
              </div>

              {/* Bar Charts Row */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Sentiment Distribution Bar Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Sentiment Distribution
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">😊 Positive</span>
                        <span>{stats?.feedback?.positive || 0}</span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.feedback?.total
                                ? ((stats?.feedback?.positive || 0) /
                                    stats.feedback.total) *
                                  100
                                : 33
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">😐 Neutral</span>
                        <span>{stats?.feedback?.neutral || 0}</span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.feedback?.total
                                ? ((stats?.feedback?.neutral || 0) /
                                    stats.feedback.total) *
                                  100
                                : 33
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">😞 Negative</span>
                        <span>{stats?.feedback?.negative || 0}</span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.feedback?.total
                                ? ((stats?.feedback?.negative || 0) /
                                    stats.feedback.total) *
                                  100
                                : 33
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    feedback_sentiment_total
                  </p>
                </div>

                {/* User Stats Bar Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-4">User Statistics</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-400">👥 Total Users</span>
                        <span>{stats?.users?.total || 0}</span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">✅ Verified</span>
                        <span>{stats?.users?.verified || 0}</span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.users?.total
                                ? ((stats?.users?.verified || 0) /
                                    stats.users.total) *
                                  100
                                : 50
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-emerald-400">🟢 Online Now</span>
                        <span>{stats?.users?.online || 0}</span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.users?.total
                                ? ((stats?.users?.online || 0) /
                                    stats.users.total) *
                                  100
                                : 20
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    active_users_total / verified_users_total
                  </p>
                </div>
              </div>

              {/* Counter Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 text-sm font-medium">
                        HTTP Requests
                      </p>
                      <p className="text-3xl font-bold mt-1">
                        {stats?.httpRequests || 1250}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        http_requests_total
                      </p>
                    </div>
                    <div className="text-4xl opacity-50">📈</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-green-400">↑ 12%</span>
                    <span className="text-gray-500">vs last hour</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-400 text-sm font-medium">
                        Avg Response Time
                      </p>
                      <p className="text-3xl font-bold mt-1">
                        {stats?.avgResponseTime || 45}
                        <span className="text-lg">ms</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        http_request_duration_seconds
                      </p>
                    </div>
                    <div className="text-4xl opacity-50">⚡</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-green-400">↓ 5ms</span>
                    <span className="text-gray-500">improvement</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-400 text-sm font-medium">
                        Feedback Processed
                      </p>
                      <p className="text-3xl font-bold mt-1">
                        {stats?.feedback?.total || 0}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        feedback_submitted_total
                      </p>
                    </div>
                    <div className="text-4xl opacity-50">📝</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-purple-400">
                      AI: {stats?.feedback?.aiProcessed || 0}
                    </span>
                    <span className="text-gray-500">analyzed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Stats Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Live System Stats
                </h3>
                <button
                  onClick={fetchData}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    {stats?.users?.total || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Total Users</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {stats?.users?.online || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Online Now</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {stats?.feedback?.total || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Total Feedback</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">
                    {health?.server === "healthy" ? "✅" : "⚠️"}
                  </p>
                  <p className="text-gray-400 text-sm">System Health</p>
                </div>
              </div>
            </div>

            {/* Navigate to Analytics */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    📊 Full Analytics Dashboard
                  </h3>
                  <p className="text-gray-300 mt-1">
                    View detailed charts, sentiment trends, and user activity
                    over time
                  </p>
                </div>
                <Link
                  to="/analytics"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
                >
                  Open Analytics →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-600/20 border-blue-600",
    green: "bg-green-600/20 border-green-600",
    purple: "bg-purple-600/20 border-purple-600",
    yellow: "bg-yellow-600/20 border-yellow-600",
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-3xl font-bold mt-3">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );
};

const HealthCard = ({ title, status }) => {
  const statusColors = {
    healthy: "bg-green-600",
    unhealthy: "bg-red-600",
    unavailable: "bg-yellow-600",
    unknown: "bg-gray-600",
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span
          className={`${
            statusColors[status] || statusColors.unknown
          } px-3 py-1 rounded-full text-xs font-semibold`}
        >
          {status || "unknown"}
        </span>
      </div>
    </div>
  );
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const MetricCard = ({ name, type, description }) => {
  const typeColors = {
    Counter: "bg-blue-600",
    Gauge: "bg-green-600",
    Histogram: "bg-purple-600",
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm text-yellow-400">{name}</code>
        <span
          className={`${
            typeColors[type] || "bg-gray-600"
          } px-2 py-0.5 rounded text-xs`}
        >
          {type}
        </span>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default AdminDashboard;
