export default function ScoreBadge({ score, tier, label }) {
  return (
    <div className="scoreBadge">
      <strong>{score}</strong>
      <span>{tier}</span>
      <small>{label}</small>
    </div>
  );
}
