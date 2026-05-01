import type { ReactNode } from 'react';
import { TM, FONT_MONO } from './tokens';

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export default function TMFrame({ title = 'mathlab', subtitle, children }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: TM.bgDeep,
        color: TM.fg,
        fontFamily: FONT_MONO,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: TM.panel,
          borderBottom: `1px solid ${TM.rule}`,
        }}
      >
        <span style={{ width: 10, height: 10, background: TM.red, borderRadius: '50%' }} />
        <span style={{ width: 10, height: 10, background: TM.amber, borderRadius: '50%' }} />
        <span style={{ width: 10, height: 10, background: TM.green, borderRadius: '50%' }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: TM.dim }}>
          {title} <span style={{ color: TM.fg }}>·</span> {subtitle}
        </span>
        <span style={{ fontSize: 11, color: TM.dim }}>● online</span>
      </div>
      <div style={{ flex: 1, background: TM.bg, position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}
