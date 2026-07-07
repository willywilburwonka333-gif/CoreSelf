const nodes = [
  ['Human Dylan', 'Family', 'Health', 'Freedom', 'Dreams'],
  ['Executive Dylan', 'Projects', 'Wealth', 'Learning', 'Creation'],
  ['Projects', 'THE SYSTEM', 'Core Self', 'Reality Project', 'Music'],
  ['Engines', 'Memory', 'Learning', 'Wealth', 'Creation', 'Guardian'],
];

export default function LifeGraph() {
  return (
    <section className="screen">
      <h2>Life Graph</h2>
      <p className="muted">The living model of Dylan’s life.</p>
      <div className="graph">
        {nodes.map(([title, ...items]) => (
          <article key={title}>
            <h3>{title}</h3>
            {items.map((item) => <span key={item}>{item}</span>)}
          </article>
        ))}
      </div>
    </section>
  );
}
