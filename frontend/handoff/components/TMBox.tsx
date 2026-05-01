import type { CSSProperties, ReactNode } from 'react';
import { TM } from './tokens';

interface Props {
  title?: string;
  accent?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export default function TMBox({ title, accent = TM.amber, style, children }: Props) {
  return (
    <section
      style={{
        background: TM.panel,
        borderLeft: `2px solid ${accent}`,
        border: `1px solid ${TM.rule}`,
        borderLeftWidth: 2,
        borderLeftColor: accent,
        padding: 14,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 10,
            color: accent,
            letterSpacing: 1.5,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{title}</span>
          <span style={{ flex: 1, borderTop: `1px dashed ${TM.rule}` }} />
        </div>
      )}
      {children}
    </section>
  );
}
