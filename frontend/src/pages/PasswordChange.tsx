import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { updatePassword } from '../services/api.ts';
import { TM, TMFrame, TMField, TMBtn, TMBox, TMPrompt } from '../components/terminal';

function getStrength(pwd: string): number {
  if (pwd.length === 0) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'débil', 'regular', 'buena', 'fuerte'];
const STRENGTH_COLORS = ['', TM.red, TM.amberSoft, TM.amber, TM.green];

const PasswordChange = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updatePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch {
      setError('no pudimos actualizar la contraseña. verificá la contraseña actual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TMFrame title="mathlab" subtitle="~/profile/password">
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 32px)',
          padding: 36,
        }}
      >
        <form onSubmit={handleSubmit} style={{ width: 420, maxWidth: '100%' }}>
          <TMPrompt color={TM.cyan}>./change_password</TMPrompt>
          <h1 style={{ fontSize: 26, color: TM.fg, fontWeight: 700, margin: '14px 0 6px' }}>
            <span style={{ color: TM.amber }}>&gt;</span> cambiar contraseña
          </h1>
          <div style={{ fontSize: 11, color: TM.dim, marginBottom: 22 }}>
            // elegí una clave segura que no uses en otros sitios
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <TMField label="contraseña actual" placeholder="••••••••" type="password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />

            <TMField label="nueva contraseña" placeholder="••••••••" type="password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>

          <div style={{ marginTop: 14 }}>
            <TMBox title="STRENGTH" accent={strength >= 3 ? TM.green : TM.amber}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: 6,
                      background: strength >= level ? STRENGTH_COLORS[strength] : TM.rule,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 11, color: strength > 0 ? STRENGTH_COLORS[strength] : TM.dim }}>
                {strength > 0 ? `// ${STRENGTH_LABELS[strength]}` : '// escribí la nueva clave para ver la fortaleza'}
              </div>
            </TMBox>
          </div>

          {error && (
            <div style={{ marginTop: 14, fontSize: 12, color: TM.red }}>
              <span style={{ color: TM.dim }}>err →</span> {error}
            </div>
          )}
          {success && (
            <div style={{ marginTop: 14, fontSize: 12, color: TM.green }}>
              <span style={{ color: TM.dim }}>[x]</span> contraseña actualizada. cerrando sesión…
            </div>
          )}

          <div style={{ marginTop: 22, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <TMBtn kind="ghost" onClick={() => navigate(-1)}>./cancelar</TMBtn>
            <TMBtn kind="amber" size="lg" type="submit" disabled={loading}>
              {loading ? './actualizando…' : './save --password'}
            </TMBtn>
          </div>
        </form>
      </main>
    </TMFrame>
  );
};

export default PasswordChange;
