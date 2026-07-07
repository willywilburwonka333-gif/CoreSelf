const modes = ['Talk', 'Build', 'Create', 'Learn', 'Wealth', 'Life', 'Memory'];

export default function ModeBar({ mode, setMode }) {
  return (
    <div className="modeBar">
      {modes.map((item) => (
        <button key={item} onClick={() => setMode(item)} className={mode === item ? 'active' : ''}>
          {item}
        </button>
      ))}
    </div>
  );
}
