import React, { useState } from 'react';
import { updatePassword } from '../../services/api';

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await updatePassword({ 
        currentPassword: formData.currentPassword, 
        newPassword: formData.newPassword 
      });
      setSuccess('Password updated successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError('Failed to update password. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Change Password</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Current Password:</label>
          <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required />
        </div>
        <div>
          <label>New Password:</label>
          <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} required />
        </div>
        <div>
          <label>Confirm New Password:</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
};

export default PasswordChange;
