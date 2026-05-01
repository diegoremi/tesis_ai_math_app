import type { CSSProperties, ReactNode, MouseEventHandler } from 'react';
import { TM } from './tokens';

type Kind = 'amber' | 'cyan' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  kind?: Kind;
  size?: Size;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function TMBtn({
  kind = 'amber',
  size = 'md',
  onClick,
  style,
  children,
  type = 'button',
  disabled,
}: Props) {
  const pad =
    size === 'sm' ? '4px 10px' :
    size === 'lg' ? '10px 18px' : '7px 14px';
  const fs = size === 'sm' ? 11 : size === 'lg' ? 14 : 13;

  let bg = 'transparent';
  let color = TM.fg;
  let border = `1px solid ${TM.rule}`;
  if (kind === 'amber') { bg = TM.amber; color = TM.bgDeep; border = `1px solid ${TM.amber}`; }
  else if (kind === 'cyan') { bg = TM.cyan; color = TM.bgDeep; border = `1px solid ${TM.cyan}`; }
  else { color = TM.fg; }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: bg,
        color,
        border,
        padding: pad,
        fontSize: fs,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
