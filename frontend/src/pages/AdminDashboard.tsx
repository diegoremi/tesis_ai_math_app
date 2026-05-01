import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import {
  exportData,
  fetchAdminReport,
  getAnalytics,
  getParticipantProgress,
} from '../services/api.ts';

interface AnalyticsData {
  overview: {
    totalParticipants: number;
    consentCount: number;
    pretestCount: number;
    posttestCount: number;
    pretestRate: number;
    posttestRate: number;
  };
  groups: Record<string, number>;
  dailySignups: Array<{ date: string; count: number }>;
  scores: {
    pretestAverage: number;
    posttestAverage: number;
  };
}

interface Participant {
  id: number;
  code: string;
  name: string;
  email: string;
  group: string;
  registeredAt: string;
  hasConsent: boolean;
  hasPretest: boolean;
  hasPosttest: boolean;
  exerciseCount: number;
  progress: {
    registered: boolean;
    consented: boolean;
    pretested: boolean;
    completed: boolean;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'exports'>('overview');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [reportRes, analyticsRes, progressRes] = await Promise.all([
          fetchAdminReport(),
          getAnalytics(),
          getParticipantProgress(),
        ]);
        setReport(reportRes.data as Record<string, unknown>);
        setAnalytics(analyticsRes.data as AnalyticsData);
        setParticipants(progressRes.data as Participant[]);
      } catch {
        setError('No pudimos cargar los datos del admin.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleExport = async (type: string) => {
    try {
      const response = await exportData(type);
      const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Error al exportar datos.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b1210]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const groupPerformance = (report?.groupPerformance as Array<Record<string, unknown>>) ?? [];
  const overview = analytics?.overview;

  const getProgressColor = (step: boolean) =>
    step ? 'bg-emerald-500' : 'bg-gray-600';

  return (
    <div className="min-h-screen bg-[#0b1210] text-white">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">Admin Dashboard</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Volver</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>

      <main className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Panel de administración</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#29382f]">
          {(['overview', 'participants', 'exports'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Resumen' : tab === 'participants' ? 'Participantes' : 'Exportar'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                <p className="text-xs text-[#6aa58e] uppercase">Total</p>
                <p className="text-3xl font-bold">{overview?.totalParticipants ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">participantes</p>
              </div>
              <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                <p className="text-xs text-[#6aa58e] uppercase">Consentimiento</p>
                <p className="text-3xl font-bold">{overview?.consentCount ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview?.totalParticipants ? Math.round((overview.consentCount / overview.totalParticipants) * 100) : 0}%
                </p>
              </div>
              <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                <p className="text-xs text-[#6aa58e] uppercase">Pretest</p>
                <p className="text-3xl font-bold">{overview?.pretestCount ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{overview?.pretestRate ?? 0}%</p>
              </div>
              <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                <p className="text-xs text-[#6aa58e] uppercase">Postest</p>
                <p className="text-3xl font-bold">{overview?.posttestCount ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{overview?.posttestRate ?? 0}%</p>
              </div>
            </div>

            {/* Group Distribution */}
            {analytics?.groups && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Distribución por grupo</h2>
                  <div className="flex items-center gap-4">
                    {Object.entries(analytics.groups).map(([group, count]) => (
                      <div key={group} className="flex-1">
                        <div
                          className={`rounded-xl p-4 text-center ${
                            group === 'GE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-sm">{group === 'GE' ? 'Experimental' : 'Control'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Promedios de evaluación</h2>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pretest</span>
                        <span>{analytics.scores.pretestAverage.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-[#29382f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((analytics.scores.pretestAverage / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Postest</span>
                        <span>{analytics.scores.posttestAverage.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-[#29382f] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min((analytics.scores.posttestAverage / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Group Performance Table */}
            {groupPerformance.length > 0 && (
              <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Rendimiento por grupo</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#29382f]">
                        <th className="text-left py-2 px-4">Grupo</th>
                        <th className="text-left py-2 px-4">N</th>
                        <th className="text-left py-2 px-4">Pretest</th>
                        <th className="text-left py-2 px-4">Postest</th>
                        <th className="text-left py-2 px-4">Delta</th>
                        <th className="text-left py-2 px-4">TAM Utilidad</th>
                        <th className="text-left py-2 px-4">TAM Facilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupPerformance.map((g, i) => (
                        <tr key={i} className="border-b border-[#29382f]/50">
                          <td className="py-2 px-4 font-medium">{String(g.group)}</td>
                          <td className="py-2 px-4">{String(g.participants)}</td>
                          <td className="py-2 px-4">{g.pretestAverage !== null ? String(g.pretestAverage) : '-'}</td>
                          <td className="py-2 px-4">{g.posttestAverage !== null ? String(g.posttestAverage) : '-'}</td>
                          <td className={`py-2 px-4 ${Number(g.delta) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {g.delta !== null ? String(g.delta) : '-'}
                          </td>
                          <td className="py-2 px-4">{g.tamUtilidad !== null ? String(g.tamUtilidad) : '-'}</td>
                          <td className="py-2 px-4">{g.tamFacilidad !== null ? String(g.tamFacilidad) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'participants' && (
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Progreso de participantes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#29382f]">
                    <th className="text-left py-2 px-3">ID</th>
                    <th className="text-left py-2 px-3">Nombre</th>
                    <th className="text-left py-2 px-3">Grupo</th>
                    <th className="text-left py-2 px-3">Progreso</th>
                    <th className="text-left py-2 px-3">Ejercicios</th>
                    <th className="text-left py-2 px-3">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-[#29382f]/50">
                      <td className="py-2 px-3 font-mono text-xs">{p.code.slice(0, 8)}...</td>
                      <td className="py-2 px-3">{p.name || p.email}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            p.group === 'GE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : p.group === 'GC'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {p.group}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(p.progress.registered)}`} title="Registrado" />
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(p.progress.consented)}`} title="Consentimiento" />
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(p.progress.pretested)}`} title="Pretest" />
                          <div className={`w-2 h-2 rounded-full ${getProgressColor(p.progress.completed)}`} title="Postest" />
                        </div>
                      </td>
                      <td className="py-2 px-3">{p.exerciseCount}</td>
                      <td className="py-2 px-3 text-xs text-gray-400">
                        {new Date(p.registeredAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Exportar datos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleExport('users')}
                className="rounded-xl px-6 py-4 bg-[#1a2a24] border border-[#29382f] hover:border-emerald-500 transition text-left"
              >
                <p className="font-bold">Usuarios</p>
                <p className="text-xs text-gray-500">Datos demográficos</p>
              </button>
              <button
                onClick={() => handleExport('assessments')}
                className="rounded-xl px-6 py-4 bg-[#1a2a24] border border-[#29382f] hover:border-emerald-500 transition text-left"
              >
                <p className="font-bold">Evaluaciones</p>
                <p className="text-xs text-gray-500">Pretest y postest</p>
              </button>
              <button
                onClick={() => handleExport('activities')}
                className="rounded-xl px-6 py-4 bg-[#1a2a24] border border-[#29382f] hover:border-emerald-500 transition text-left"
              >
                <p className="font-bold">Actividades</p>
                <p className="text-xs text-gray-500">Ejercicios y teoría</p>
              </button>
              <button
                onClick={() => handleExport('ancova')}
                className="rounded-xl px-6 py-4 bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500/20 transition text-left"
              >
                <p className="font-bold text-emerald-400">Dataset ANCOVA</p>
                <p className="text-xs text-gray-500">Para análisis estadístico</p>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
