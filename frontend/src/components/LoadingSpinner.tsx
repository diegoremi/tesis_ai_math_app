import { TM, FONT_MONO } from './terminal';

interface Props {
  message?: string;
}

const LoadingSpinner = ({ message = 'cargando…' }: Props) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: TM.bgDeep,
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: TM.amber, fontFamily: FONT_MONO, marginBottom: 8 }}>
        $ {message}
        <span style={{ animation: 'tm-blink 1.1s steps(1) infinite', marginLeft: 4 }}>▌</span>
      </div>
      <div style={{ fontSize: 10, color: TM.dim, fontFamily: FONT_MONO }}>// por favor esperá</div>
    </div>
  </div>
);

export default LoadingSpinner;
