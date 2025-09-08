import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { getActivities, getAssessments } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Chatbot from './Chatbot'; // Import Chatbot component
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false); // State for chatbot modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activitiesResponse = await getActivities();
        setActivities(activitiesResponse.data);

        const assessmentsResponse = await getAssessments();
        setAssessments(assessmentsResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const activityData = {
    labels: activities.map(act => new Date(act.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Correct Answers',
        data: activities.map(act => act.correct_answers),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Attempts',
        data: activities.map(act => act.attempts),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const assessmentData = {
    labels: assessments.map(ass => `${ass.assessment_type} (${new Date(ass.created_at).toLocaleDateString()})`),
    datasets: [
      {
        label: 'Total Score',
        data: assessments.map(ass => ass.total_score),
        borderColor: 'rgb(53, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Progress',
      },
    },
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Welcome to your Dashboard!</h2>
        <nav className="dashboard-nav">
          <Link to="/profile">Profile</Link>
          <Link to="/exercises">Exercises</Link>
          <Link to="/survey">Survey</Link>
          {user && user.role === 'admin' && (
            <Link to="/admin">Admin</Link>
          )}
          <button onClick={() => setShowChatbot(true)}>Chatbot</button>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Your Activities Summary</h3>
          {activities.length > 0 ? (
            <div>
              <p>Total Activities: {activities.length}</p>
              <Line data={activityData} options={chartOptions} />
            </div>
          ) : (
            <p>No activities recorded yet.</p>
          )}
        </div>

        <div className="dashboard-card">
          <h3>Your Assessments Summary</h3>
          {assessments.length > 0 ? (
            <div>
              <p>Total Assessments: {assessments.length}</p>
              <Line data={assessmentData} options={chartOptions} />
            </div>
          ) : (
            <p>No assessments recorded yet.</p>
          )}
        </div>
      </div>

      {showChatbot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowChatbot(false)}>&times;</button>
            <Chatbot />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
