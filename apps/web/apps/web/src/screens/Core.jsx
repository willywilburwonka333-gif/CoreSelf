import { constitution } from '../data/constitution';

export default function Core() {
  return (
    <section className="screen">
      <h2>Core Constitution</h2>
      <article className="constitution">
        <h3>{constitution.coreName}</h3>
        <p>{constitution.identity}</p>
        <h3>Prime Directive</h3>
        <p>{constitution.primeDirective}</p>
        <h3>Core Laws</h3>
        <ol>
          {constitution.laws.map((law) => <li key={law}>{law}</li>)}
        </ol>
      </article>
    </section>
  );
}
