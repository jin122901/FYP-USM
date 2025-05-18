import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalFeedbacks: 0,
    recentAnalyses: [],
    sentimentTrend: [],
    topicDistribution: [],
    courseStats: []
  });

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // You'll need to implement these endpoints in your backend
        const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // Sample data (replace with actual data from your backend)
  const sampleData = {
    totalUsers: 150,
    totalFeedbacks: 1200,
    sentimentTrend: [
      { month: 'Jan', positive: 65, negative: 20, neutral: 15 },
      { month: 'Feb', positive: 70, negative: 15, neutral: 15 },
      { month: 'Mar', positive: 60, negative: 25, neutral: 15 },
      { month: 'Apr', positive: 75, negative: 10, neutral: 15 },
    ],
    topicDistribution: [
      { name: 'Course Content', value: 35 },
      { name: 'Teaching Method', value: 25 },
      { name: 'Assessment', value: 20 },
      { name: 'Resources', value: 15 },
      { name: 'Others', value: 5 },
    ],
    courseStats: [
      { name: 'Course A', feedbacks: 120, positive: 80, negative: 20 },
      { name: 'Course B', feedbacks: 90, positive: 60, negative: 30 },
      { name: 'Course C', feedbacks: 150, positive: 100, negative: 50 },
      { name: 'Course D', feedbacks: 80, positive: 50, negative: 30 },
    ]
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Total Users</h6>
              <h3>{sampleData.totalUsers}</h3>
              <div className="text-success small">
                <i className="bi bi-arrow-up"></i> 12% increase
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Total Feedbacks</h6>
              <h3>{sampleData.totalFeedbacks}</h3>
              <div className="text-success small">
                <i className="bi bi-arrow-up"></i> 8% increase
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Positive Sentiment</h6>
              <h3>72%</h3>
              <div className="text-success small">
                <i className="bi bi-arrow-up"></i> 5% increase
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Active Courses</h6>
              <h3>24</h3>
              <div className="text-success small">
                <i className="bi bi-arrow-up"></i> 3 new
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row mb-4">
        {/* Sentiment Trend */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Sentiment Trend</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sampleData.sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="positive" stroke="#28a745" />
                  <Line type="monotone" dataKey="negative" stroke="#dc3545" />
                  <Line type="monotone" dataKey="neutral" stroke="#ffc107" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Topic Distribution */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Topic Distribution</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sampleData.topicDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sampleData.topicDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .card {
            transition: transform 0.2s;
          }
          .card:hover {
            transform: translateY(-5px);
          }
          .text-success {
            color: #28a745;
          }
        `}
      </style>
    </div>
  );
};

export default AdminDashboard;
