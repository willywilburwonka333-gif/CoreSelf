const items = [
  ['Dream Product', 3],
  ['Phone App', 18],
  ['Useful AI Assistant', 7],
  ['Learning AI Self', 3],
  ['Autonomous Helper', 1],
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
