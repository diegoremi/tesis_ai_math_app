
import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

import PasswordChange from './auth/PasswordChange';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setUser(response.data);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to fetch profile');
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await updateProfile(formData);
      setUser(response.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div>No user data found.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>User Profile</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
      <div className="profile-card">
        {!isEditing ? (
          <div className="profile-info">
            <p><strong>First Name:</strong> {user.first_name}</p>
            <p><strong>Last Name:</strong> {user.last_name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Age:</strong> {user.age}</p>
            <p><strong>Education Level:</strong> {user.education_level}</p>
            <p><strong>Goal:</strong> {user.goal}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div>
              <label>First Name:</label>
              <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} />
            </div>
            <div>
              <label>Last Name:</label>
              <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} />
            </div>
            <div>
              <label>Email:</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} disabled />
            </div>
            <div>
              <label>Age:</label>
              <input type="number" name="age" value={formData.age || ''} onChange={handleChange} />
            </div>
            <div>
              <label>Education Level:</label>
              <input type="text" name="education_level" value={formData.education_level || ''} onChange={handleChange} />
            </div>
            <div>
              <label>Goal:</label>
              <input type="text" name="goal" value={formData.goal || ''} onChange={handleChange} />
            </div>
            <div>
              <label>Password (leave blank to keep current):</label>
              <input type="password" name="password" value={formData.password || ''} onChange={handleChange} />
            </div>
            <div className="profile-actions">
              <button type="submit" disabled={loading}>Update Profile</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
        <PasswordChange />
      </div>
    </div>
  );
};

export default Profile;
