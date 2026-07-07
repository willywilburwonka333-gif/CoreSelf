const items = [
  ['Dream Product', 9],
  ['Phone App', 36],
  ['Useful AI Foundation', 26],
  ['Learning AI Self', 14],
  ['Autonomous Helper', 4],
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
