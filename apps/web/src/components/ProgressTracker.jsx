const items = [
  ['Dream Product', 7],
  ['Phone App', 32],
  ['Useful AI Foundation', 18],
  ['Learning AI Self', 8],
  ['Autonomous Helper', 2],
];

export default function ProgressTracker() {
  return (
    <div className="progressPanel">
      <h3>Build Progress</h3>
      {items.map(([name, value]) => (
        <div className="progressRow" key={name}>
          <div>
            <span>{name}</span>
            <strong>{value}%</strong>
          </div>
          <div className="bar"><i style={{ width: `${value}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
