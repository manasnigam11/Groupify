import './InterestChip.css';

export default function InterestChip({ interest, selected, onToggle, size = 'default' }) {
  return (
    <button
      className={`interest-chip ${selected ? 'selected' : ''} ${size}`}
      onClick={() => onToggle?.(interest.id)}
      type="button"
      id={`interest-${interest.id}`}
    >
      <span className="chip-emoji">{interest.emoji}</span>
      <span className="chip-label">{interest.label}</span>
      {selected && <span className="chip-check">✓</span>}
    </button>
  );
}
