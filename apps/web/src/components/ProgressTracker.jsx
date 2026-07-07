const items = [
  ['Dream Product', 5],
  ['Phone App', 25],
  ['Useful AI Foundation', 10],
  ['Learning AI Self', 5],
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
