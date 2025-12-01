import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { feedbackAPI } from "../services/api";
import Navbar from "../components/Navbar";

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await feedbackAPI.getStats();
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err) {
        setError("Failed to load analytics data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const sentimentColors = {
    positive: {
      bg: "bg-green-100",
      text: "text-green-800",
      bar: "bg-green-500",
    },
    negative: { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
    neutral: { bg: "bg-gray-100", text: "text-gray-800", bar: "bg-gray-500" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📊 Analytics</h1>
            <p className="text-gray-600 mt-1">
              View detailed feedback analytics and sentiment trends
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Feedback"
            value={stats?.total || 0}
            icon="📝"
            color="blue"
          />
          <StatCard
            title="Positive"
            value={stats?.breakdown?.positive?.count || 0}
            percentage={stats?.breakdown?.positive?.percentage || 0}
            icon="😊"
            color="green"
          />
          <StatCard
            title="Neutral"
            value={stats?.breakdown?.neutral?.count || 0}
            percentage={stats?.breakdown?.neutral?.percentage || 0}
            icon="😐"
            color="gray"
          />
          <StatCard
            title="Negative"
            value={stats?.breakdown?.negative?.count || 0}
            percentage={stats?.breakdown?.negative?.percentage || 0}
            icon="😞"
            color="red"
          />
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Sentiment Distribution
          </h2>

          {stats?.total > 0 ? (
            <div className="space-y-4">
              {["positive", "neutral", "negative"].map((sentiment) => {
                const data = stats?.breakdown?.[sentiment];
                const percentage = parseFloat(data?.percentage || 0);
                const colors = sentimentColors[sentiment];

                return (
                  <div key={sentiment} className="flex items-center">
                    <span className="w-24 text-sm font-medium text-gray-700 capitalize">
                      {sentiment}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span
                      className={`w-20 text-sm font-semibold ${colors.text}`}
                    >
                      {percentage}%
                    </span>
                    <span className="w-16 text-sm text-gray-600 text-right">
                      ({data?.count || 0})
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No feedback data yet</p>
              <p className="text-sm mt-2">
                Submit some feedback to see analytics
              </p>
              <button
                onClick={() => navigate("/feedback")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>

        {/* Average Confidence */}
        {stats?.total > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Analysis Confidence
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {["positive", "neutral", "negative"].map((sentiment) => {
                const data = stats?.breakdown?.[sentiment];
                const confidence = parseFloat(data?.avgConfidence || 0) * 100;
                const colors = sentimentColors[sentiment];

                return (
                  <div
                    key={sentiment}
                    className={`${colors.bg} rounded-lg p-4`}
                  >
                    <h3 className={`font-semibold capitalize ${colors.text}`}>
                      {sentiment}
                    </h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">
                      {confidence.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Avg. Confidence</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, percentage, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    gray: "bg-gray-50 border-gray-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {percentage !== undefined && (
          <span className="text-sm font-medium text-gray-500">
            {percentage}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mt-3">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

export default Analytics;
