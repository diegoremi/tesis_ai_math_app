import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { TM, TMFrame, TMField, TMBtn, TMPrompt } from '../components/terminal';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({ email, password });
      if (result === 'pretest') navigate('/study/pretest', { replace: true });
      else if (result === 'dashboard') navigate('/dashboard', { replace: true });
      else setError('correo o contraseña incorrectos.');
    } catch {
      setError('no pudimos iniciar sesión. verificá tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TMFrame title="mathlab" subtitle="~/auth/login">
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
          <TMPrompt color={TM.cyan}>./login</TMPrompt>
          <h1 style={{ fontSize: 30, color: TM.fg, fontWeight: 700, margin: '14px 0 6px' }}>
            <span style={{ color: TM.amber }}>&gt;</span> bienvenida de vuelta
          </h1>
          <div style={{ fontSize: 11, color: TM.dim, marginBottom: 22 }}>
            // ingresá para retomar tu camino
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <TMField label="email" placeholder="lucia@correo.com"
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TMField label="passwd" placeholder="••••••••"
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div style={{ marginTop: 14, fontSize: 12, color: TM.red }}>
              <span style={{ color: TM.dim }}>err →</span> {error}
            </div>
          )}

          <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              onClick={() => navigate('/forgot')}
              style={{ fontSize: 11, color: TM.cyan, cursor: 'pointer' }}
            >// olvidé mi clave</span>
            <TMBtn kind="amber" size="lg" type="submit" disabled={loading}>
              {loading ? './validando…' : './enter'}
            </TMBtn>
          </div>

          <div style={{
            marginTop: 32, paddingTop: 18, borderTop: `1px dashed ${TM.rule}`,
            fontSize: 12, color: TM.dim, textAlign: 'center',
          }}>
            ¿primera vez?{' '}
            <span onClick={() => navigate('/register')} style={{ color: TM.amber, cursor: 'pointer' }}>
              ./register --new
            </span>
          </div>
        </form>
      </main>
    </TMFrame>
  );
};

export default Login;
