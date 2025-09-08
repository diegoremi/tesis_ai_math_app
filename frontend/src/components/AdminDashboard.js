import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { getUsers, getAdminActivities, getAdminAssessments, exportData } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || (user && (user.role !== 'admin' && user.role !== 'facilitator'))) {
        navigate('/');
        return;
      }
      try {
        const usersResponse = await getUsers();
        setUsers(usersResponse.data);

        const activitiesResponse = await getAdminActivities();
        setActivities(activitiesResponse.data);

        const assessmentsResponse = await getAdminAssessments();
        setAssessments(assessmentsResponse.data);

      } catch (err) {
        setError('Failed to fetch admin data');
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, navigate]);

  const handleExport = async (dataType) => {
    try {
      const response = await exportData(dataType);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data.');
    }
  };

  if (loading) {
    return <div>Loading Admin Dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <h2>Admin/Facilitator Dashboard</h2>
      <div className="admin-dashboard-section">
        <h3>User Management</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-dashboard-section">
        <h3>Activities Data</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Type</th>
              <th>Difficulty</th>
              <th>Attempts</th>
              <th>Correct</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.activity_id}>
                <td>{a.activity_id}</td>
                <td>{a.user_id}</td>
                <td>{a.activity_type}</td>
                <td>{a.difficulty_level}</td>
                <td>{a.attempts}</td>
                <td>{a.correct_answers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-dashboard-section">
        <h3>Assessments Data</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Type</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(ass => (
              <tr key={ass.assessment_id}>
                <td>{ass.assessment_id}</td>
                <td>{ass.user_id}</td>
                <td>{ass.assessment_type}</td>
                <td>{ass.total_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-dashboard-section">
        <h3>Data Export</h3>
        <button onClick={() => handleExport('users')}>Export Users CSV</button>
        <button onClick={() => handleExport('activities')}>Export Activities CSV</button>
        <button onClick={() => handleExport('assessments')}>Export Assessments CSV</button>
      </div>
    </div>
  );
};

export default AdminDashboard;
