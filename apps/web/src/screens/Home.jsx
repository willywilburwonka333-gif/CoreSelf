import PotentialAvatar from '../components/PotentialAvatar';
import ProgressTracker from '../components/ProgressTracker';
import PresenceBanner from '../components/PresenceBanner';
import { constitution } from '../data/constitution';
import { load } from '../services/localStore';
import { defaultProjects, defaultGoals } from '../data/defaults';
import { buildDailyReflection, buildTodayContext } from '../services/livingMemoryEngine';

export default function Home({ mode }) {
  const memories = load('memories', []);
  const projects = load('projects', defaultProjects);
  const goals = load('goals', defaultGoals);
  const plans = load('plans', []);
  const suggestions = load('memorySuggestions', []);
  const activityLog = load('activityLog', []);
  const today = buildTodayContext({ memories, projects, goals, plans, suggestions, activityLog });
  const reflection = buildDailyReflection({ memories, projects, goals, plans, suggestions, activityLog });

  return (
    <section className="screen">
      <div className="hero">
        <div>
          <p className="eyebrow">CORE SELF / GENESIS 0.7.2</p>
          <h1>Dylan Core</h1>
          <p>{constitution.primeDirective}</p>
          <p className="muted">{reflection.greeting} {reflection.summary}</p>
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
          <p>{reflection.recommendedAction}</p>
        </article>
        <article>
          <span>Rule</span>
          <h3>Future Dylan First</h3>
          <p>Every decision should improve Dylan’s long-term life.</p>
        </article>
      </div>

      <div className="briefing livingBrief">
        <h3>Today's Context</h3>
        <ul>
          <li><strong>Confirmed Memories:</strong> {today.memoryCount}</li>
          <li><strong>Pending Memory Suggestions:</strong> {today.pendingSuggestionCount}</li>
          <li><strong>Active Projects:</strong> {today.projectCount}</li>
          <li><strong>Active Goals:</strong> {today.goalCount}</li>
          <li><strong>Reflection:</strong> {reflection.question}</li>
        </ul>
      </div>

      <ProgressTracker />
    </section>
  );
}
