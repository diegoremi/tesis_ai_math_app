import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { getActivities, getAssessments } from '../services/api';
import Chatbot from './Chatbot';
import TopNav from './layout/TopNav';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, featureFlags } = useAuth();
  const [activities, setActivities] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesResponse, assessmentsResponse] = await Promise.all([
          getActivities(),
          getAssessments(),
        ]);
        setActivities(activitiesResponse.data);
        setAssessments(assessmentsResponse.data);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar tu información. Inicia sesión nuevamente.');
        logout();
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logout, navigate]);

  if (loading) {
    return <div className="text-center text-white mt-10">Cargando panel...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 mt-10">{error}</div>;
  }

  const chatbotEnabled = Boolean(featureFlags?.chatbot);
  const adaptativeEnabled = Boolean(featureFlags?.adaptativo);

  const getLatestByType = (type) => {
    const filtered = assessments.filter((assessment) => assessment.assessment_type === type);
    if (!filtered.length) return null;
    return filtered.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
    filtered[0]);
  };

  const latestPre = getLatestByType('pretest');
  const latestPost = getLatestByType('posttest');
  const deltaScore = latestPre && latestPost && latestPre.total_score !== null && latestPost.total_score !== null
    ? latestPost.total_score - latestPre.total_score
    : null;

  return (
    <div
      className="relative flex min-h-screen flex-col bg-[#0b1210] text-white"
      style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}
    >
      <TopNav />
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <p className="text-sm font-medium text-[#9eb7a8]">
              {featureFlags?.assigned_group ? `Grupo ${featureFlags.assigned_group}` : 'Aún sin asignar'}
            </p>
            <h1 className="text-4xl font-bold mt-1">Tu ruta de aprendizaje</h1>
            <p className="text-lg text-gray-300 mt-2">
              Avanza paso a paso. Aquí encontrarás las actividades recomendadas para hoy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-[#29382f] bg-[#1a221d] p-5">
              <p className="text-sm text-[#9eb7a8]">Pretest</p>
              <p className="text-3xl font-bold mt-2">{latestPre?.total_score ?? '—'}</p>
              <p className="text-xs text-[#9eb7a8] mt-3">
                {latestPre ? `Último: ${new Date(latestPre.created_at).toLocaleDateString()}` : 'Completa el pretest inicial'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#29382f] bg-[#1a221d] p-5">
              <p className="text-sm text-[#9eb7a8]">Postest</p>
              <p className="text-3xl font-bold mt-2">{latestPost?.total_score ?? '—'}</p>
              <p className="text-xs text-[#9eb7a8] mt-3">
                {latestPost ? `Último: ${new Date(latestPost.created_at).toLocaleDateString()}` : 'Completa el postest para registrar avances'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#29382f] bg-[#1a221d] p-5">
              <p className="text-sm text-[#9eb7a8]">Diferencia</p>
              <p className={`text-3xl font-bold mt-2 ${deltaScore !== null ? (deltaScore >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                {deltaScore !== null ? `${deltaScore >= 0 ? '+' : ''}${deltaScore}` : '—'}
              </p>
              <p className="text-xs text-[#9eb7a8] mt-3">Comparación entre tu último pre y postest</p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold border-b border-[#29382f] pb-3">Módulo del día</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-[#1a221d] rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--primary-color)]/10 transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold mb-2">Teoría guiada</h3>
                  <p className="text-[#9eb7a8] text-sm leading-relajed">
                    Repasa conceptos clave con ejemplos resueltos y notas descargables.
                  </p>
                </div>
                <button
                  className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-[var(--primary-color)] text-black text-base font-bold hover:opacity-90 transition-opacity"
                  type="button"
                  onClick={() => navigate('/study/pretest')}
                >
                  <span>Ir a teoría</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="w-full bg-center bg-no-repeat aspect-square md:aspect-auto bg-cover rounded-2xl" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBEkOTrKpYD6mjHGt8vkXE8o7dzWQBfuUCvhgJGYM_4EJzdfiJ7gq6L6BwRpZSyOfppEuYmjF7jeBl7tgAsZ_DrlPYBXQj90nyVwzrLikcKZiY65-tmHkUzOj4A6GvJ41OkJu4_v9PipH8-P4j-cgbZX_mx0EWRbwIF_p8_p7Jp242sOyJhQpw1XIoe41AyQGjqRRpxpQIl8Gs9xD9WRS97eSW3URkGjK0-xelG09E23am80qHn2vzKUKu3UAXDlhyVlz244boNoCo")'}}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="w-full bg-center bg-no-repeat aspect-square md:aspect-auto bg-cover rounded-2xl order-last md:order-first" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB_4c3kfvN3ifviUlT1OwjnJ_ktQy7JU5goG6hTNihBthVIiTLk8mtACAqDcbYGKkuJQvdXqP4N2hXnBrQ8OEPn2yL_C7qv2CrveR9GA95woAzX4xy0wiAUETfYywOkQVOatsBrkNyOF0qHTKedyYcyulzEZXK6bHiTKX0MRhjX3_wzHcZMqFiJ-bq2V-JDnUx6NRYSOtuJvnYtA0XyEDQZeFqSZTQrIUIR47jzmkTGNJuRgI7yNZe7A4dHmYcUU2U2DOvkj0Vsvak")'}}></div>
              <div className="bg-[#1a221d] rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-[var(--primary-color)]/10 transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold mb-2">Práctica guiada</h3>
                  <p className="text-[#9eb7a8] text-sm leading-relajed">
                    Resuelve ejercicios adaptativos y recibe retroalimentación inmediata.
                  </p>
                </div>
                <Link
                  to="/exercises"
                  className="mt-6 w-full md:w-auto flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-[var(--primary-color)] text-black text-base font-bold hover:opacity-90 transition-opacity"
                >
                  <span>{adaptativeEnabled ? 'Practicar con IA' : 'Practicar ahora'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
         <div className="text-center mt-16">
            <p className="text-lg text-gray-400">"La única forma de aprender matemática es haciéndola." – Paul Halmos</p>
            <p className="text-sm text-gray-500 mt-2">Mantén la constancia: cada sesión suma a tu progreso.</p>
          </div>
          <div className="space-y-4 rounded-2xl bg-[#1a221d] p-6 shadow-lg mt-10">
            <h3 className="text-lg font-bold text-white">Progreso diario</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-white">Ejercicios resueltos hoy</p>
                <p className="text-sm font-normal text-gray-300">
                  {activities.length}
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-[#3d5245]">
                <div
                  className="h-2 rounded-full bg-[var(--primary-color)]"
                  style={{ width: `${Math.min(activities.length * 10, 100)}%` }}
                ></div>
              </div>
              <p className="text-right text-sm font-medium text-white">
                {activities.length ? '¡Sigue así!' : 'Comienza una práctica para sumar progreso.'}
              </p>
            </div>
          </div>
        </div>
        {chatbotEnabled && (
          <button
            type="button"
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-10 right-12 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-color)] text-[#111714] shadow-lg transition-transform hover:scale-105"
          >
            <span className="material-symbols-outlined text-3xl">chat</span>
          </button>
        )}
      </main>
      {chatbotEnabled && showChatbot && (
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
