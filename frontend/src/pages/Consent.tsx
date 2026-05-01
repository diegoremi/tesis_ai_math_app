import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { submitConsent } from '../services/api.ts';
import { TM, TMFrame, TMBox, TMBtn, TMPrompt } from '../components/terminal';

const Consent = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!accepted) {
      setError('tenés que aceptar el consentimiento para continuar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitConsent({ documentVersion: 'v1', accepted: true });
      navigate('/study/pretest');
    } catch {
      setError('no pudimos registrar el consentimiento. intentá de nuevo.');
      setLoading(false);
    }
  };

  return (
    <TMFrame title="mathlab" subtitle="~/auth/consent">
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 32px)',
          padding: '36px 20px',
        }}
      >
        <div style={{ width: 540, maxWidth: '100%' }}>
          <TMPrompt color={TM.cyan}>./consent --read</TMPrompt>
          <h1 style={{ fontSize: 26, color: TM.fg, fontWeight: 700, margin: '14px 0 6px' }}>
            <span style={{ color: TM.amber }}>&gt;</span> consentimiento informado
          </h1>
          <div style={{ fontSize: 11, color: TM.dim, marginBottom: 22 }}>
            // leé con atención antes de continuar
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <TMBox title="QUÉ ESTAMOS ESTUDIANDO" accent={TM.amber}>
              <p style={{ fontSize: 13, color: TM.fg, lineHeight: 1.6, margin: 0 }}>
                este estudio evalúa el impacto de un tutor inteligente en el aprendizaje de
                matemáticas básicas en adultos. queremos entender cómo la IA puede ayudarte
                a mejorar tu rendimiento académico.
              </p>
            </TMBox>

            <TMBox title="QUÉ RECOLECTAMOS" accent={TM.cyan}>
              <div style={{ fontSize: 13, color: TM.fg, lineHeight: 1.7 }}>
                <div><span style={{ color: TM.cyan }}>↳</span> respuestas a ejercicios y tests</div>
                <div><span style={{ color: TM.cyan }}>↳</span> tiempos de sesión y patrones de uso</div>
                <div><span style={{ color: TM.cyan }}>↳</span> interacciones con el tutor IA</div>
                <div style={{ marginTop: 8, fontSize: 11, color: TM.dim }}>
                  // todos los datos son confidenciales y de uso académico exclusivo
                </div>
              </div>
            </TMBox>

            <TMBox title="TUS DERECHOS" accent={TM.amber}>
              <div style={{ fontSize: 13, color: TM.fg, lineHeight: 1.7 }}>
                <div><span style={{ color: TM.amber }}>↳</span> participación 100% voluntaria</div>
                <div><span style={{ color: TM.amber }}>↳</span> podés retirarte en cualquier momento sin penalización</div>
                <div><span style={{ color: TM.amber }}>↳</span> podés solicitar la eliminación de tus datos</div>
                <div style={{ marginTop: 8, fontSize: 11, color: TM.dim }}>
                  // ante dudas, contactá al investigador principal
                </div>
              </div>
            </TMBox>
          </div>

          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', margin: '22px 0 0',
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ marginTop: 2, accentColor: TM.amber }}
            />
            <span style={{ fontSize: 13, color: TM.fg }}>
              leí y entendí la información. acepto participar voluntariamente en este estudio.
            </span>
          </label>

          {error && (
            <div style={{ marginTop: 14, fontSize: 12, color: TM.red }}>
              <span style={{ color: TM.dim }}>err →</span> {error}
            </div>
          )}

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TMBtn kind="ghost" onClick={logout}>./salir</TMBtn>
            <TMBtn kind="amber" size="lg" onClick={handleSubmit} disabled={loading}>
              {loading ? './procesando…' : './continuar --pretest →'}
            </TMBtn>
          </div>
        </div>
      </main>
    </TMFrame>
  );
};

export default Consent;
