import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import {
  getUsers,
  getAdminActivities,
  getAdminAssessments,
  exportData,
  randomizeParticipants,
  getRandomizationSummary,
  updateUserFeatureFlags,
  fetchAdminReport,
} from '../services/api';
import TopNav from './layout/TopNav';
import LoadingSpinner from './common/LoadingSpinner';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
  const [flagNotice, setFlagNotice] = useState(null);
  const [flagError, setFlagError] = useState(null);

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

  const handleDownloadReport = async () => {
    try {
      const response = await fetchAdminReport();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('No pudimos descargar el reporte completo.');
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

  const canEditFlags = user?.role === 'admin';

  const handleToggleFlag = async (userId, payload) => {
    if (!canEditFlags) {
      return;
    }
    setFlagNotice(null);
    setFlagError(null);
    try {
      const response = await updateUserFeatureFlags(userId, payload);
      const updatedFlag = response.data?.featureFlag ?? null;
      const updatedGroup = response.data?.assignment ?? null;

      setUsers((prev) =>
        prev.map((candidate) => {
          if (candidate.user_id !== userId) {
            return candidate;
          }
          const nextAssignments = updatedGroup
            ? [{ ...(candidate.assignments?.[0] ?? {}), group: updatedGroup }]
            : candidate.assignments;
          return {
            ...candidate,
            featureFlag: updatedFlag,
            assignments: nextAssignments,
          };
        }),
      );

      await fetchRandomizationSummary();
      setFlagNotice('Actualizamos las opciones de tutoría.');
    } catch (err) {
      console.error('Error updating feature flags:', err);
      setFlagError('No pudimos actualizar los flags del usuario.');
    }
  };

  const summaryCards = useMemo(() => ([
    {
      label: 'Usuarios registrados',
      value: users.length,
      tone: 'primary',
    },
    {
      label: 'Actividades registradas',
      value: activities.length,
      tone: 'neutral',
    },
    {
      label: 'Evaluaciones cargadas',
      value: assessments.length,
      tone: 'neutral',
    },
  ]), [users.length, activities.length, assessments.length]);

  const performanceChart = useMemo(() => {
    if (!assessments.length) {
      return null;
    }

    const groupMap = new Map();
    users.forEach((participant) => {
      const group = participant.assignments?.[0]?.group ?? 'Sin grupo';
      groupMap.set(participant.user_id, group);
    });

    const accumulator = new Map();
    assessments.forEach((assessment) => {
      if (assessment.total_score == null) {
        return;
      }
      const group = groupMap.get(assessment.user_id) ?? 'Sin grupo';
      const bucket = accumulator.get(group) ?? { pre: [], post: [] };
      if (assessment.assessment_type === 'pretest') {
        bucket.pre.push(assessment.total_score);
      } else if (assessment.assessment_type === 'posttest') {
        bucket.post.push(assessment.total_score);
      }
      accumulator.set(group, bucket);
    });

    const labels = Array.from(accumulator.keys());
    if (!labels.length) {
      return null;
    }

    const average = (values) => (values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0);

    const data = {
      labels,
      datasets: [
        {
          label: 'Pretest',
          data: labels.map((label) => average(accumulator.get(label)?.pre ?? [])),
          backgroundColor: '#4acbb2',
          borderRadius: 6,
        },
        {
          label: 'Postest',
          data: labels.map((label) => average(accumulator.get(label)?.post ?? [])),
          backgroundColor: '#38ef7d',
          borderRadius: 6,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#cbe0d7',
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#9eb7a8' },
          grid: { color: '#1f2c26' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#9eb7a8' },
          grid: { color: '#1f2c26' },
        },
      },
    };

    return { data, options };
  }, [assessments, users]);

  if (loading) {
    return <LoadingSpinner label="Preparando panel administrativo…" fullscreen subdued />;
  }

  return (
    <div
      className="relative min-h-screen bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <TopNav />
      <main className="px-6 md:px-10 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-[#6aa58e]">Administración</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Panel de investigación</h1>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleExport('users')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#203028] px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Exportar usuarios
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('activities')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#203028] px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Exportar actividades
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('assessments')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#203028] px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Exportar evaluaciones
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#203028] px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Reporte completo
                  <span className="material-symbols-outlined text-base">analytics</span>
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-[#203028] bg-[#101a17] p-6 shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-[#6aa58e]">{card.label}</p>
                <p className="mt-4 text-3xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </section>

          {performanceChart && (
            <section className="rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
              <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Rendimiento por grupo</h2>
                  <p className="text-sm text-[#94b1a3]">Promedios de pretest y postest según la cohorte asignada.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExport('ancova')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#203028] px-5 text-sm font-semibold text-[#cbe0d7] transition hover:border-[var(--primary-color)] hover:text-white"
                >
                  Descargar dataset ANCOVA
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
              </header>
              <div className="h-72">
                <Bar data={performanceChart.data} options={performanceChart.options} />
              </div>
            </section>
          )}

          <section className="space-y-4 rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Participantes registrados</h2>
                <p className="text-sm text-[#94b1a3]">Gestiona accesos al tutor y revisa la condición experimental.</p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1f2c26]">
                <thead className="bg-[#14201c] text-xs uppercase tracking-[0.2em] text-[#6aa58e]">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Correo</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Condición</th>
                    <th className="px-4 py-3 text-left">Tutor IA</th>
                    <th className="px-4 py-3 text-left">Chatbot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2c26] text-sm">
                  {users.map((participant) => {
                    const fullName = [participant.first_name, participant.last_name].filter(Boolean).join(' ') || 'Sin nombre';
                    const group = participant.assignments?.[0]?.group;
                    const conditionLabel = group === 'GE' ? 'Experimental (IA)' : group === 'GC' ? 'Control' : 'Pendiente';
                    const adaptativo = Boolean(participant.featureFlag?.adaptativo);
                    const chatbot = Boolean(participant.featureFlag?.chatbot);

                    return (
                      <tr key={participant.user_id} className="hover:bg-[#18231f]">
                        <td className="px-4 py-3 text-white">{fullName}</td>
                        <td className="px-4 py-3 text-[#cbe0d7]">{participant.email}</td>
                        <td className="px-4 py-3 text-[#9eb7a8] uppercase">{participant.role}</td>
                        <td className="px-4 py-3 text-[#cbe0d7]">{conditionLabel}</td>
                        <td className="px-4 py-3">
                          <label className={`relative inline-flex h-6 w-11 items-center ${!canEditFlags ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={adaptativo}
                              disabled={!canEditFlags}
                              onChange={(event) => handleToggleFlag(participant.user_id, { adaptativo: event.target.checked })}
                              aria-label={`Activar tutor IA para ${fullName}`}
                            />
                            <span className="absolute h-6 w-11 rounded-full bg-[#1f2b26] transition peer-checked:bg-[var(--primary-color)]" />
                            <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <label className={`relative inline-flex h-6 w-11 items-center ${!canEditFlags ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={chatbot}
                              disabled={!canEditFlags}
                              onChange={(event) => handleToggleFlag(participant.user_id, { chatbot: event.target.checked })}
                              aria-label={`Activar chatbot para ${fullName}`}
                            />
                            <span className="absolute h-6 w-11 rounded-full bg-[#1f2b26] transition peer-checked:bg-[var(--primary-color)]" />
                            <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                  {!users.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#6aa58e]">
                        No hay usuarios registrados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(flagNotice || flagError) && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  flagError
                    ? 'border border-red-500/40 bg-red-500/10 text-red-200'
                    : 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                }`}
              >
                {flagError || flagNotice}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Actividades registradas</h2>
                <p className="text-sm text-[#94b1a3]">Intentos de práctica y métricas agregadas.</p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1f2c26]">
                <thead className="bg-[#14201c] text-xs uppercase tracking-[0.2em] text-[#6aa58e]">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Dificultad</th>
                    <th className="px-4 py-3 text-left">Intentos</th>
                    <th className="px-4 py-3 text-left">Aciertos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2c26] text-sm">
                  {activities.map((activity) => (
                    <tr key={activity.activity_id} className="hover:bg-[#18231f]">
                      <td className="px-4 py-3 text-[#9eb7a8]">{activity.activity_id}</td>
                      <td className="px-4 py-3 text-[#cbe0d7]">{activity.user_id}</td>
                      <td className="px-4 py-3 text-white">{activity.activity_type}</td>
                      <td className="px-4 py-3 text-[#9eb7a8]">{activity.difficulty_level}</td>
                      <td className="px-4 py-3 text-[#cbe0d7]">{activity.attempts}</td>
                      <td className="px-4 py-3 text-[#cbe0d7]">{activity.correct_answers}</td>
                    </tr>
                  ))}
                  {!activities.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#6aa58e]">
                        Todavía no se registran actividades.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Evaluaciones</h2>
                <p className="text-sm text-[#94b1a3]">Últimos pretest y postest registrados.</p>
              </div>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#1f2c26]">
                <thead className="bg-[#14201c] text-xs uppercase tracking-[0.2em] text-[#6aa58e]">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Puntaje</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2c26] text-sm">
                  {assessments.map((assessment) => (
                    <tr key={assessment.assessment_id} className="hover:bg-[#18231f]">
                      <td className="px-4 py-3 text-[#9eb7a8]">{assessment.assessment_id}</td>
                      <td className="px-4 py-3 text-[#cbe0d7]">{assessment.user_id}</td>
                      <td className="px-4 py-3 text-white">{assessment.assessment_type}</td>
                      <td className="px-4 py-3 text-[#cbe0d7]">{assessment.total_score ?? '—'}</td>
                      <td className="px-4 py-3 text-[#9eb7a8]">
                        {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {!assessments.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-[#6aa58e]">
                        Todavía no se registran evaluaciones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {user?.role === 'admin' && (
            <section className="space-y-6 rounded-3xl border border-[#203028] bg-[#101a17] p-6 md:p-8 shadow-lg">
              <header className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Asignación experimental</h2>
                <p className="text-sm text-[#94b1a3]">Randomizá a los participantes entre GE y GC con balance supervisado.</p>
              </header>

              {randomizationSummary ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#1f2b26] bg-[#14201c] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Totales</p>
                    <p className="mt-2 text-2xl font-bold">{randomizationSummary.totalParticipants}</p>
                  </div>
                  <div className="rounded-2xl border border-[#1f2b26] bg-[#14201c] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Asignados</p>
                    <p className="mt-2 text-sm text-[#cbe0d7]">GE: {randomizationSummary.assigned?.GE ?? 0} · GC: {randomizationSummary.assigned?.GC ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-[#1f2b26] bg-[#14201c] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#6aa58e]">Pendientes</p>
                    <p className="mt-2 text-2xl font-bold">{randomizationSummary.unassigned}</p>
                    {randomizationSummary.lastRun && (
                      <p className="mt-2 text-xs text-[#94b1a3]">
                        Última ejecución: {new Date(randomizationSummary.lastRun.assigned_at).toLocaleString('es-AR', { hour12: false })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1f2b26] bg-[#14201c] px-4 py-3 text-sm text-[#6aa58e]">
                  Todavía no se ejecutó ninguna asignación.
                </div>
              )}

              <form onSubmit={handleRandomize} className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm text-[#cbe0d7]">
                  Método
                  <select
                    value={randomizeMethod}
                    onChange={(event) => setRandomizeMethod(event.target.value)}
                    className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                  >
                    <option value="azar">Azar (balance automático)</option>
                    <option value="emparejamiento">Emparejamiento manual</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#cbe0d7]">
                  Semilla (opcional)
                  <input
                    type="text"
                    value={randomizeSeed}
                    onChange={(event) => setRandomizeSeed(event.target.value)}
                    placeholder="ej. semana-01"
                    className="w-full rounded-full border border-[#203028] bg-[#0d1612] px-4 py-3 text-white placeholder:text-[#6aa58e] focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={randomizeLoading}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary-color)] px-6 text-sm font-semibold text-[#0b1210] transition hover:bg-opacity-90 disabled:opacity-60"
                  >
                    {randomizeLoading ? 'Asignando…' : 'Ejecutar asignación'}
                  </button>
                </div>
              </form>

              {randomizeMessage && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {randomizeMessage}
                </div>
              )}
              {randomizeError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {randomizeError}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
