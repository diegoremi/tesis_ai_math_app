import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { registerUser } from '../services/api.ts';
import { TM, TMFrame, TMField, TMBtn, TMPrompt, TMBox } from '../components/terminal';

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box' as const,
  background: TM.panel,
  color: TM.fg,
  border: `1px solid ${TM.rule}`,
  borderLeft: `2px solid ${TM.amber}`,
  padding: '8px 12px',
  marginTop: 4,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  borderRadius: 0,
};

const labelStyle = {
  fontSize: 10,
  color: TM.amber,
  letterSpacing: 1.5,
} as const;

const Register = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    age: '',
    education_level: 'high_school',
    math_goals: '',
    agree_terms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const recaptchaToken = recaptchaRef.current?.getValue?.();
    if (recaptchaSiteKey && !recaptchaToken) {
      setError('completá el reCAPTCHA antes de continuar.');
      setLoading(false);
      return;
    }

    try {
      const nameParts = formData.full_name.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const registrationPayload: Record<string, unknown> = {
        ...formData,
        first_name,
        last_name,
        goal: formData.math_goals,
      };

      if (recaptchaSiteKey && recaptchaToken) {
        registrationPayload.recaptchaToken = recaptchaToken;
      }

      await registerUser(registrationPayload);
      recaptchaRef.current?.reset();
      setShowSuccessModal(true);
    } catch {
      recaptchaRef.current?.reset();
      setError('no pudimos crear tu cuenta. revisá los datos e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TMFrame title="mathlab" subtitle="~/auth/register">
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 32px)',
          padding: '36px 20px',
        }}
      >
        <form onSubmit={handleSubmit} style={{ width: 460, maxWidth: '100%' }}>
          <TMPrompt color={TM.cyan}>./register --new</TMPrompt>
          <h1 style={{ fontSize: 26, color: TM.fg, fontWeight: 700, margin: '14px 0 6px' }}>
            <span style={{ color: TM.amber }}>&gt;</span> crear cuenta
          </h1>
          <div style={{ fontSize: 11, color: TM.dim, marginBottom: 22 }}>
            // completá tus datos para unirte al estudio
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <TMField label="nombre completo" placeholder="Ana Pérez"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />

            <TMField label="email" placeholder="ana@correo.com" type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />

            <TMField label="contraseña" placeholder="mínimo 8 caracteres" type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TMField label="edad" placeholder="22" type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })} required />

              <label style={{ display: 'block' }}>
                <span style={labelStyle}>&gt; nivel educativo</span>
                <div style={{ position: 'relative' }}>
                  <select
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      paddingRight: 28,
                      width: '100%',
                    }}
                  >
                    <option value="high_school">secundario</option>
                    <option value="university">universitario</option>
                    <option value="other">otro</option>
                  </select>
                  <span style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    color: TM.amber, fontSize: 12, pointerEvents: 'none',
                  }}>▾</span>
                </div>
              </label>
            </div>

            <label style={{ display: 'block' }}>
              <span style={labelStyle}>&gt; objetivos con matemática</span>
              <textarea
                name="math_goals"
                value={formData.math_goals}
                onChange={handleChange}
                placeholder="ej. aprobar análisis, reforzar álgebra"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </label>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, agree_terms: !formData.agree_terms })}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                background: 'transparent', border: 'none', padding: 0, textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 13, color: TM.amber, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>
                {formData.agree_terms ? '[x]' : '[ ]'}
              </span>
              <span style={{ fontSize: 12, color: TM.dim }}>
                acepto los términos y condiciones del estudio
              </span>
            </button>
          </div>

          {recaptchaSiteKey ? (
            <div style={{ marginTop: 14 }}>
              <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaSiteKey} theme="dark" />
            </div>
          ) : (
            <div style={{ marginTop: 14, fontSize: 11, color: TM.red }}>
              <span style={{ color: TM.dim }}>warn →</span> falta configurar la clave reCAPTCHA en el entorno.
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, fontSize: 12, color: TM.red }}>
              <span style={{ color: TM.dim }}>err →</span> {error}
            </div>
          )}

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <TMBtn kind="amber" size="lg" type="submit" disabled={loading}>
              {loading ? './creando…' : './crear --cuenta'}
            </TMBtn>
          </div>

          <div style={{
            marginTop: 28, paddingTop: 14, borderTop: `1px dashed ${TM.rule}`,
            fontSize: 12, color: TM.dim, textAlign: 'center',
          }}>
            ¿ya tenés cuenta?{' '}
            <span onClick={() => navigate('/')} style={{ color: TM.amber, cursor: 'pointer' }}>
              ./login
            </span>
          </div>

          <div style={{ marginTop: 12, fontSize: 10, color: TM.dim, textAlign: 'center' }}>
            sitio protegido por reCAPTCHA ·{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
              style={{ color: TM.cyan }}>privacidad</a>{' '}y{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"
              style={{ color: TM.cyan }}>términos</a>{' '}de Google
          </div>
        </form>
      </main>

      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(16,14,12,0.85)', padding: '0 24px',
        }}>
          <TMBox title="CUENTA CREADA" accent={TM.green} style={{ width: 380, maxWidth: '100%' }}>
            <div style={{ fontSize: 13, color: TM.fg, marginBottom: 8 }}>
              <span style={{ color: TM.green }}>[x]</span> tus datos fueron guardados correctamente.
            </div>
            <div style={{ fontSize: 12, color: TM.dim, marginBottom: 20 }}>
              // iniciá sesión para comenzar el estudio
            </div>
            <TMBtn kind="amber" onClick={() => navigate('/')}>
              ./ir al login
            </TMBtn>
          </TMBox>
        </div>
      )}
    </TMFrame>
  );
};

export default Register;
