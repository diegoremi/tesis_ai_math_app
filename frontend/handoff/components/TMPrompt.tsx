import type { ReactNode } from 'react';
import { TM } from './tokens';

interface Props {
  children: ReactNode;
  color?: string;
}

export default function TMPrompt({ children, color = TM.amber }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
      <span style={{ color: TM.dim }}>$</span>
      <span style={{ color }}>{children}</span>
      <span style={{ color: TM.amber, animation: 'tm-blink 1.1s steps(1) infinite' }}>▌</span>
    </div>
  );
}
