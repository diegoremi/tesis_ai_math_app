import { TM } from './tokens';

interface Item { id: string; label: string }
interface Props {
  items?: Item[];
  active?: string;
  onNav?: (id: string) => void;
}

const DEFAULT: Item[] = [
  { id: 'dash', label: 'dashboard' },
  { id: 'theory', label: 'teoría' },
  { id: 'practice', label: 'práctica' },
  { id: 'chatbot', label: 'tutor' },
  { id: 'profile', label: 'perfil' },
];

export default function TMNav({ items = DEFAULT, active, onNav }: Props) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 24,
        padding: '10px 18px',
        borderBottom: `1px solid ${TM.rule}`,
        fontSize: 13,
        background: TM.bg,
      }}
    >
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onNav?.(it.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: on ? TM.amber : TM.fg,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              borderBottom: on ? `1px solid ${TM.amber}` : '1px solid transparent',
              paddingBottom: 4,
            }}
          >
            {on && <span>▸ </span>}
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
