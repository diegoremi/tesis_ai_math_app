import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import {
  exportData,
  fetchAdminReport,
  getAnalytics,
  getParticipantProgress,
} from '../services/api.ts';
import { TM, TMFrame, TMBox, TMBtn, FONT_MONO } from '../components/terminal';

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

// ─── Sparkline SVG inline ──────────────────────────────────────
const Sparkline = ({
  values,
  color,
  width = 140,
  height = 44,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) => {
  if (values.length < 2) {
    return <svg width={width} height={height}><line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={TM.rule} strokeWidth={1} /></svg>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const lastX = pad + (width - pad * 2);
  const lastY = pad + (1 - (values[values.length - 1] - min) / range) * (height - pad * 2);
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={lastX} cy={lastY} r={3} fill={color} />
    </svg>
  );
};

// ─── Barra horizontal de salud ─────────────────────────────────
const HealthBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
      <span style={{ color: TM.dim }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{pct}%</span>
    </div>
    <div style={{ height: 6, background: TM.rule }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color }} />
    </div>
  </div>
);

// ─── Color de mastery ──────────────────────────────────────────
const masteryColor = (pct: number) => pct >= 70 ? TM.green : pct >= 40 ? TM.amber : TM.red;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError('no pudimos cargar los datos del admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

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
      setError('error al exportar datos.');
    }
  };

  if (loading) {
    return (
      <TMFrame title="mathlab.admin" subtitle="~/admin/dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 32px)' }}>
          <span style={{ fontSize: 12, color: TM.dim }}>$ cargando datos…</span>
        </div>
      </TMFrame>
    );
  }

  const overview = analytics?.overview;
  const groupPerformance = (report?.groupPerformance as Array<Record<string, unknown>>) ?? [];
  const ge = groupPerformance.find((g) => g.group === 'GE');
  const gc = groupPerformance.find((g) => g.group === 'GC');

  // KPI derivados
  const totalUsers = overview?.totalParticipants ?? 0;
  const totalSessions = participants.reduce((s, p) => s + p.exerciseCount, 0);
  const avgMastery = analytics?.scores.posttestAverage ?? 0;
  const completedCount = participants.filter((p) => p.progress.completed).length;
  const dropoffPct = totalUsers > 0 ? Math.round(((totalUsers - completedCount) / totalUsers) * 100) : 0;

  // Sparkline: use dailySignups as cumulative trend if available, else pre→post scores
  const signupCounts = analytics?.dailySignups?.map((d) => d.count) ?? [];
  const signupCumulative = signupCounts.reduce<number[]>((acc, v) => {
    acc.push((acc[acc.length - 1] ?? 0) + v);
    return acc;
  }, []);
  const geSparkline = signupCumulative.length >= 2
    ? signupCumulative
    : ge
      ? [Number(ge.pretestAverage) || 0, Number(ge.posttestAverage) || 0]
      : analytics?.scores ? [analytics.scores.pretestAverage, analytics.scores.posttestAverage] : [0, 0];
  const gcSparkline = gc
    ? [Number(gc.pretestAverage) || 0, Number(gc.posttestAverage) || 0]
    : [0, 0];

  // Tabla: últimos 6 participantes
  const latest6 = [...participants]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 6);

  // Study health
  const pct = (n: number) => totalUsers > 0 ? Math.round((n / totalUsers) * 100) : 0;
  const consentPct = pct(overview?.consentCount ?? 0);
  const pretestPct = pct(overview?.pretestCount ?? 0);
  const activePct = pct(participants.filter((p) => p.exerciseCount > 0).length);
  const posttestPct = pct(overview?.posttestCount ?? 0);
  const surveyPct = pct(completedCount);

  return (
    <TMFrame title="mathlab.admin" subtitle="~/admin/dashboard">
      {/* Sub-header ADMIN */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 22px',
        background: TM.panel, borderBottom: `1px solid ${TM.rule}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: TM.amber, fontFamily: FONT_MONO }}>
            ▒▓ ADMIN
          </span>
          <span style={{ fontSize: 11, color: TM.dim }}>
            role: researcher · access: full
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TMBtn kind="ghost" size="sm" onClick={fetchData}>./refresh</TMBtn>
          <TMBtn kind="amber" size="sm" onClick={() => handleExport('ancova')}>./export csv</TMBtn>
          <span
            onClick={logout}
            style={{ fontSize: 11, color: TM.dim, cursor: 'pointer', marginLeft: 8 }}
          >
            // ./logout
          </span>
        </div>
      </div>

      <main style={{ padding: 22, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        {error && (
          <div style={{ marginBottom: 16, fontSize: 12, color: TM.red }}>
            <span style={{ color: TM.dim }}>err →</span> {error}
          </div>
        )}

        {/* KPIs 4 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
          <TMBox title="USERS" accent={TM.amber}>
            <div style={{ fontSize: 32, fontWeight: 700, color: TM.amber, lineHeight: 1 }}>{totalUsers}</div>
            <div style={{ fontSize: 11, color: TM.dim, marginTop: 6 }}>
              {analytics?.groups ? Object.entries(analytics.groups).map(([g, n]) => `${g}: ${n}`).join(' · ') : '─'}
            </div>
          </TMBox>
          <TMBox title="SESSIONS" accent={TM.cyan}>
            <div style={{ fontSize: 32, fontWeight: 700, color: TM.cyan, lineHeight: 1 }}>{totalSessions}</div>
            <div style={{ fontSize: 11, color: TM.dim, marginTop: 6 }}>// ejercicios totales</div>
          </TMBox>
          <TMBox title="AVG_MASTERY" accent={TM.green}>
            <div style={{ fontSize: 32, fontWeight: 700, color: TM.green, lineHeight: 1 }}>
              {avgMastery > 0 ? avgMastery.toFixed(1) : '─'}
            </div>
            <div style={{ fontSize: 11, color: TM.dim, marginTop: 6 }}>
              pre: {analytics?.scores.pretestAverage.toFixed(1) ?? '─'}
            </div>
          </TMBox>
          <TMBox title="DROPOFF" accent={TM.red}>
            <div style={{ fontSize: 32, fontWeight: 700, color: TM.red, lineHeight: 1 }}>{dropoffPct}%</div>
            <div style={{ fontSize: 11, color: TM.dim, marginTop: 6 }}>
              // {totalUsers - completedCount} sin completar
            </div>
          </TMBox>
        </div>

        {/* Grid 2 columnas: sparklines + study health */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 18 }}>
          {/* Sparklines MASTERY */}
          <TMBox title="MASTERY · GROUP A vs B" accent={TM.amber}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: TM.amber }}>grupo A · tutor ia (GE)</span>
                  <span style={{ fontSize: 11, color: TM.dim }}>
                    {ge ? `${Number(ge.pretestAverage).toFixed(1)} → ${Number(ge.posttestAverage).toFixed(1)}` : '─'}
                  </span>
                </div>
                <Sparkline values={geSparkline} color={TM.amber} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: TM.cyan }}>grupo B · control (GC)</span>
                  <span style={{ fontSize: 11, color: TM.dim }}>
                    {gc ? `${Number(gc.pretestAverage).toFixed(1)} → ${Number(gc.posttestAverage).toFixed(1)}` : '─'}
                  </span>
                </div>
                <Sparkline values={gcSparkline} color={TM.cyan} />
              </div>
              {ge && gc && (
                <div style={{ fontSize: 11, color: TM.dim, borderTop: `1px dashed ${TM.rule}`, paddingTop: 8 }}>
                  delta GE: <span style={{ color: Number(ge.delta) >= 0 ? TM.green : TM.red }}>{Number(ge.delta) >= 0 ? '+' : ''}{Number(ge.delta).toFixed(1)}</span>
                  {' · '}
                  delta GC: <span style={{ color: Number(gc.delta) >= 0 ? TM.green : TM.red }}>{Number(gc.delta) >= 0 ? '+' : ''}{Number(gc.delta).toFixed(1)}</span>
                </div>
              )}
            </div>
          </TMBox>

          {/* Study Health */}
          <TMBox title="STUDY HEALTH" accent={TM.cyan}>
            <HealthBar label="consent" pct={consentPct} color={TM.amber} />
            <HealthBar label="pretest" pct={pretestPct} color={TM.cyan} />
            <HealthBar label="active 7d" pct={activePct} color={TM.amber} />
            <HealthBar label="posttest" pct={posttestPct} color={TM.green} />
            <HealthBar label="survey" pct={surveyPct} color={TM.cyan} />
          </TMBox>
        </div>

        {/* Tabla USERS · LATEST 6 */}
        <TMBox title="USERS · LATEST 6" accent={TM.amber}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: FONT_MONO }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${TM.rule}` }}>
                  {['ID', 'GROUP', 'DAYS', 'SESSIONS', 'MASTERY', 'LAST SEEN'].map((col) => (
                    <th key={col} style={{
                      textAlign: 'left', padding: '6px 12px',
                      fontSize: 10, color: TM.dim, letterSpacing: 1.5, fontWeight: 400,
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {latest6.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '14px 12px', color: TM.dim, fontSize: 12 }}>
                      // sin datos de participantes
                    </td>
                  </tr>
                )}
                {latest6.map((p) => {
                  const days = Math.floor((Date.now() - new Date(p.registeredAt).getTime()) / 86400000);
                  const steps = [p.progress.registered, p.progress.consented, p.progress.pretested, p.progress.completed].filter(Boolean).length;
                  const masteryPct = Math.round((steps / 4) * 100);
                  const mColor = masteryColor(masteryPct);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${TM.rule}` }}>
                      <td style={{ padding: '8px 12px', color: TM.amber }}>
                        {p.code.slice(0, 8)}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          color: p.group === 'GE' ? TM.amber : TM.cyan,
                          fontWeight: 700,
                        }}>
                          {p.group === 'GE' ? 'A' : p.group === 'GC' ? 'B' : p.group}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: TM.fg }}>{days}</td>
                      <td style={{ padding: '8px 12px', color: TM.fg }}>{p.exerciseCount}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ color: mColor, fontWeight: 700 }}>{masteryPct}%</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: TM.dim }}>
                        {new Date(p.registeredAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Exports inline */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${TM.rule}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { type: 'users', label: './export users' },
              { type: 'assessments', label: './export assessments' },
              { type: 'activities', label: './export activities' },
              { type: 'ancova', label: './export ancova' },
            ].map(({ type, label }) => (
              <TMBtn
                key={type}
                kind={type === 'ancova' ? 'amber' : 'ghost'}
                size="sm"
                onClick={() => handleExport(type)}
              >
                {label}
              </TMBtn>
            ))}
          </div>
        </TMBox>
      </main>
    </TMFrame>
  );
};

export default AdminDashboard;
