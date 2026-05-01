import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { getProfile, updateProfile } from '../services/api.ts';
import { TM, TMFrame, TMNav, TMBox, TMBtn, TMPrompt } from '../components/terminal';

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data as Record<string, unknown>))
      .catch(() => setError('no pudimos cargar tu perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(profile);
      setError(null);
      setSaved(true);
    } catch {
      setError('no pudimos actualizar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleNav = (id: string) => {
    if (id === 'dash') navigate('/dashboard');
    else if (id === 'theory') navigate('/theory');
    else if (id === 'practice') navigate('/exercises');
    else if (id === 'chatbot') navigate('/chatbot');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return (
      <TMFrame title="mathlab" subtitle="~/profile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 32px)' }}>
          <span style={{ fontSize: 12, color: TM.dim }}>$ cargando perfil…</span>
        </div>
      </TMFrame>
    );
  }

  const firstName = String(profile?.first_name ?? '');
  const lastName = String(profile?.last_name ?? '');
  const email = String(profile?.email ?? '');
  const role = String(profile?.role ?? '');
  const age = profile?.age ? String(profile.age) : null;
  const educationLevel = profile?.education_level ? String(profile.education_level) : null;
  const goal = profile?.goal ? String(profile.goal) : null;
  const group = profile?.group ? String(profile.group) : null;
  const initial = (firstName[0] ?? email[0] ?? '?').toUpperCase();

  return (
    <TMFrame title="mathlab" subtitle="~/profile">
      <TMNav active="profile" onNav={handleNav} />
      <main style={{ padding: 26, height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <TMPrompt>./profile --view</TMPrompt>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '14px 0 4px', color: TM.fg }}>
          <span style={{ color: TM.amber }}>&gt;</span> mi perfil
        </h1>
        <div style={{ fontSize: 11, color: TM.dim, marginBottom: 24 }}>
          // configuración y datos personales
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontSize: 12, color: TM.red }}>
            <span style={{ color: TM.dim }}>err →</span> {error}
          </div>
        )}
        {saved && (
          <div style={{ marginBottom: 16, fontSize: 12, color: TM.green }}>
            <span style={{ color: TM.dim }}>[x]</span> perfil actualizado correctamente.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Sidebar izq */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Avatar */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '24px 14px',
              background: TM.panel, border: `1px solid ${TM.rule}`,
              borderLeft: `2px solid ${TM.amber}`,
            }}>
              <div style={{
                width: 64, height: 64,
                background: TM.amber,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: TM.bgDeep,
                marginBottom: 12,
              }}>
                {initial}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TM.fg, textAlign: 'center' }}>
                {firstName} {lastName}
              </div>
              <div style={{ fontSize: 11, color: TM.dim, marginTop: 4 }}>
                {role}
                {group && <span> · grupo {group}</span>}
              </div>
            </div>

            {/* Botones de acción */}
            <TMBox title="ACCIONES" accent={TM.amber} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TMBtn kind="ghost" style={{ textAlign: 'left', width: '100%' }} onClick={() => navigate('/password')}>
                ./change_password
              </TMBtn>
              <TMBtn kind="ghost" style={{ textAlign: 'left', width: '100%' }} disabled>
                ./export_data
              </TMBtn>
              <TMBtn kind="ghost" style={{ textAlign: 'left', width: '100%' }} onClick={logout}>
                ./logout
              </TMBtn>
            </TMBox>
          </div>

          {/* Columna derecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TMBox title="DATOS" accent={TM.amber}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: TM.dim, letterSpacing: 1.5 }}>EMAIL</div>
                  <div style={{ fontSize: 13, color: TM.fg, marginTop: 2 }}>{email || '─'}</div>
                </div>
                {age && (
                  <div>
                    <div style={{ fontSize: 10, color: TM.dim, letterSpacing: 1.5 }}>EDAD</div>
                    <div style={{ fontSize: 13, color: TM.fg, marginTop: 2 }}>{age}</div>
                  </div>
                )}
                {educationLevel && (
                  <div>
                    <div style={{ fontSize: 10, color: TM.dim, letterSpacing: 1.5 }}>NIVEL EDUCATIVO</div>
                    <div style={{ fontSize: 13, color: TM.fg, marginTop: 2 }}>{educationLevel}</div>
                  </div>
                )}
              </div>
            </TMBox>

            {goal && (
              <TMBox title="OBJETIVO" accent={TM.cyan}>
                <p style={{ fontSize: 13, color: TM.fg, lineHeight: 1.6, margin: 0 }}>{goal}</p>
              </TMBox>
            )}

            <TMBox title="PREFERENCIAS" accent={TM.amber}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: TM.fg }}>
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{ accentColor: TM.amber }}
                  />
                  recibir notificaciones de progreso
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: TM.fg }}>
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{ accentColor: TM.amber }}
                  />
                  mostrar pistas en ejercicios
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: TM.fg }}>
                  <input
                    type="checkbox"
                    style={{ accentColor: TM.amber }}
                  />
                  modo de alto contraste
                </label>
              </div>
              <div style={{ marginTop: 14 }}>
                <TMBtn kind="amber" onClick={handleUpdate} disabled={saving}>
                  {saving ? './guardando…' : './save --prefs'}
                </TMBtn>
              </div>
            </TMBox>
          </div>
        </div>
      </main>
    </TMFrame>
  );
};

export default Profile;
