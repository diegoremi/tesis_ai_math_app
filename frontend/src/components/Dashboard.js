import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Handle token expiration/invalidity
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout(); // Use context logout
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logout, navigate]); // Depend on logout and navigate from context/hooks

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

  // Prepare data for Chart.js
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
    <div>
      <h2>Welcome to your Dashboard!</h2>
      <p>You are logged in.</p>

      <h3>Your Activities Summary</h3>
      {activities.length > 0 ? (
        <div>
          <p>Total Activities: {activities.length}</p>
          <div style={{ width: '600px', height: '300px' }}>
            <Line data={activityData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <p>No activities recorded yet.</p>
      )}

      <h3>Your Assessments Summary</h3>
      {assessments.length > 0 ? (
        <div>
          <p>Total Assessments: {assessments.length}</p>
          <div style={{ width: '600px', height: '300px' }}>
            <Line data={assessmentData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <p>No assessments recorded yet.</p>
      )}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;