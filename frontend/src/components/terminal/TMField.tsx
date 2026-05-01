import type { ChangeEvent } from 'react';
import { TM } from './tokens';

interface Props {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export default function TMField({ label, placeholder, type = 'text', value, onChange, required }: Props) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 10, color: TM.amber, letterSpacing: 1.5 }}>{`> ${label}`}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
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
        }}
      />
    </label>
  );
}
