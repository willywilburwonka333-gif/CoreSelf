import PotentialAvatar from '../components/PotentialAvatar';
import ProgressTracker from '../components/ProgressTracker';
import PresenceBanner from '../components/PresenceBanner';
import { constitution } from '../data/constitution';

export default function Home({ mode }) {
  return (
    <section className="screen">
      <div className="hero">
        <div>
          <p className="eyebrow">CORE SELF / GENESIS</p>
          <h1>Dylan Core</h1>
          <p>{constitution.primeDirective}</p>
        </div>
        <PotentialAvatar mode={mode} />
      </div>

      <PresenceBanner mode={mode} />

      <div className="cards">
        <article>
          <span>Mission</span>
          <h3>Make Dylan Shine</h3>
          <p>Build freedom, wealth, skill, health, creation, and family protection.</p>
        </article>
        <article>
          <span>Today</span>
          <h3>Build the Platform</h3>
          <p>Backup, settings, activity logs, AI Router prep, and Firestore readiness.</p>
        </article>
        <article>
          <span>Rule</span>
          <h3>Future Dylan First</h3>
          <p>Every decision should improve Dylan’s long-term life.</p>
        </article>
      </div>

      <ProgressTracker />
    </section>
  );
}
