import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import {
  getUsers,
  getAdminActivities,
  getAdminAssessments,
  exportData,
  randomizeParticipants,
  getRandomizationSummary,
} from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [randomizationSummary, setRandomizationSummary] = useState(null);
  const [randomizeSeed, setRandomizeSeed] = useState('');
  const [randomizeMethod, setRandomizeMethod] = useState('azar');
  const [randomizeLoading, setRandomizeLoading] = useState(false);
  const [randomizeMessage, setRandomizeMessage] = useState(null);
  const [randomizeError, setRandomizeError] = useState(null);

  const fetchRandomizationSummary = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      setRandomizationSummary(null);
      return;
    }
    try {
      const response = await getRandomizationSummary();
      setRandomizationSummary(response.data);
      setRandomizeError(null);
    } catch (err) {
      console.error('Error fetching randomization summary:', err);
      setRandomizeError('Failed to load randomization summary.');
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'facilitator')) {
        navigate('/');
        return;
      }
      try {
        const [usersResponse, activitiesResponse, assessmentsResponse] = await Promise.all([
          getUsers(),
          getAdminActivities(),
          getAdminAssessments(),
        ]);
        setUsers(usersResponse.data);
        setActivities(activitiesResponse.data);
        setAssessments(assessmentsResponse.data);
        await fetchRandomizationSummary();
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
  }, [isAuthenticated, user, navigate, fetchRandomizationSummary]);

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

  const handleRandomize = async (event) => {
    event.preventDefault();
    setRandomizeLoading(true);
    setRandomizeMessage(null);
    setRandomizeError(null);
    try {
      const payload = { method: randomizeMethod };
      if (randomizeSeed.trim()) {
        payload.seed = randomizeSeed.trim();
      }
      const response = await randomizeParticipants(payload);
      const { assigned, groups } = response.data;
      setRandomizeMessage(
        `Se asignaron ${assigned} participantes (GE: ${groups?.GE ?? 0}, GC: ${groups?.GC ?? 0}).`
      );
      await fetchRandomizationSummary();
      await getUsers().then((res) => setUsers(res.data));
    } catch (err) {
      console.error('Error randomizing participants:', err);
      const message = err?.response?.data?.message ?? 'No pudimos asignar los grupos.';
      setRandomizeError(message);
    } finally {
      setRandomizeLoading(false);
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
      <h2>Panel de administración</h2>
      <div className="admin-dashboard-section">
        <h3>Personas registradas</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
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
        <h3>Actividades</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ID usuario</th>
              <th>Tipo</th>
              <th>Dificultad</th>
              <th>Intentos</th>
              <th>Aciertos</th>
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
        <h3>Evaluaciones</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>ID usuario</th>
              <th>Tipo</th>
              <th>Puntaje</th>
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
        <h3>Exportar datos</h3>
        <button onClick={() => handleExport('users')}>Descargar usuarios (CSV)</button>
        <button onClick={() => handleExport('activities')}>Descargar actividades (CSV)</button>
        <button onClick={() => handleExport('assessments')}>Descargar evaluaciones (CSV)</button>
      </div>

      {user?.role === 'admin' && (
        <div className="admin-dashboard-section">
          <h3>Asignación de grupos</h3>
          {randomizationSummary ? (
            <div className="randomization-summary">
              <p>Participantes totales: {randomizationSummary.totalParticipants}</p>
              <p>
                Asignados — GE: {randomizationSummary.assigned?.GE ?? 0}, GC: {randomizationSummary.assigned?.GC ?? 0}
              </p>
              <p>Pendientes de asignar: {randomizationSummary.unassigned}</p>
              {randomizationSummary.lastRun && (
                <p>
                  Última ejecución: {new Date(randomizationSummary.lastRun.assigned_at).toLocaleString()} (método: {randomizationSummary.lastRun.method}
                  {randomizationSummary.lastRun.seed ? `, semilla: ${randomizationSummary.lastRun.seed}` : ''})
                </p>
              )}
            </div>
          ) : (
        <p>Todavía no se ejecutó ninguna asignación.</p>
          )}
          <form className="randomization-form" onSubmit={handleRandomize}>
            <div className="randomization-controls">
              <label>
                Método
                <select value={randomizeMethod} onChange={(e) => setRandomizeMethod(e.target.value)}>
                  <option value="azar">Azar (balance automático)</option>
                  <option value="emparejamiento">Emparejamiento manual</option>
                </select>
              </label>
              <label>
                Semilla (opcional)
                <input
                  type="text"
                  value={randomizeSeed}
                  onChange={(e) => setRandomizeSeed(e.target.value)}
                  placeholder="e.g. study-week-01"
                />
              </label>
              <button type="submit" disabled={randomizeLoading}>
                {randomizeLoading ? 'Asignando…' : 'Ejecutar asignación'}
              </button>
            </div>
          </form>
          {randomizeMessage && <p className="success-message">{randomizeMessage}</p>}
          {randomizeError && <p className="error-message">{randomizeError}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
