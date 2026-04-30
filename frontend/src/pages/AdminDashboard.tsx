import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getUsers, exportData, fetchAdminReport } from '../services/api.ts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, reportRes] = await Promise.all([
          getUsers(),
          fetchAdminReport(),
        ]);
        setUsers(usersRes.data as Array<Record<string, unknown>>);
        setReport(reportRes.data as Record<string, unknown>);
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

  return (
    <div className="min-h-screen bg-[#0b1210] text-white">
      <nav className="flex items-center justify-between border-b border-[#29382f] px-6 md:px-10 py-3">
        <span className="text-lg font-bold">Admin Dashboard</span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm hover:text-emerald-400">Volver</button>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Salir</button>
        </div>
      </nav>
      <main className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Panel de administración</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
            <p className="text-sm text-[#6aa58e] uppercase">Participantes</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
            <p className="text-sm text-[#6aa58e] uppercase">Dataset ANCOVA</p>
            <p className="text-2xl font-bold">{Number(report?.datasetSize ?? 0)}</p>
          </div>
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
            <p className="text-sm text-[#6aa58e] uppercase">Total registrados</p>
            <p className="text-2xl font-bold">{Number(report?.participantsTotal ?? 0)}</p>
          </div>
        </div>

        {groupPerformance.length > 0 && (
          <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Rendimiento por grupo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#29382f]">
                    <th className="text-left py-2 px-4">Grupo</th>
                    <th className="text-left py-2 px-4">N</th>
                    <th className="text-left py-2 px-4">Pretest</th>
                    <th className="text-left py-2 px-4">Postest</th>
                    <th className="text-left py-2 px-4">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {groupPerformance.map((g, i) => (
                    <tr key={i} className="border-b border-[#29382f]/50">
                      <td className="py-2 px-4 font-medium">{String(g.group)}</td>
                      <td className="py-2 px-4">{String(g.participants)}</td>
                      <td className="py-2 px-4">{g.pretestAverage !== null ? String(g.pretestAverage) : '-'}</td>
                      <td className="py-2 px-4">{g.posttestAverage !== null ? String(g.posttestAverage) : '-'}</td>
                      <td className="py-2 px-4">{g.delta !== null ? String(g.delta) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#101a17] border border-[#29382f] rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Exportar datos</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleExport('users')} className="rounded-full px-6 py-2 bg-emerald-500 text-black font-bold hover:opacity-90 transition">Usuarios</button>
            <button onClick={() => handleExport('assessments')} className="rounded-full px-6 py-2 bg-emerald-500 text-black font-bold hover:opacity-90 transition">Evaluaciones</button>
            <button onClick={() => handleExport('activities')} className="rounded-full px-6 py-2 bg-emerald-500 text-black font-bold hover:opacity-90 transition">Actividades</button>
            <button onClick={() => handleExport('ancova')} className="rounded-full px-6 py-2 bg-emerald-600 text-black font-bold hover:opacity-90 transition">Dataset ANCOVA</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
