import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Brain, Home as HomeIcon, MessageCircle, Database, Network, Sun, Shield, FolderKanban, Target, Cpu, Settings as SettingsIcon, ListChecks, LogOut } from 'lucide-react';
import ModeBar from './components/ModeBar';
import Home from './screens/Home';
import Talk from './screens/Talk';
import Memory from './screens/Memory';
import LifeGraph from './screens/LifeGraph';
import Briefing from './screens/Briefing';
import Core from './screens/Core';
import Projects from './screens/Projects';
import Goals from './screens/Goals';
import Planning from './screens/Planning';
import Engines from './screens/Engines';
import Activity from './screens/Activity';
import Settings from './screens/Settings';
import AuthPanel from './components/AuthPanel';
import { observeCoreUser, signOutCore } from './services/authService';

const tabs = [
  ['home', 'Home', HomeIcon],
  ['talk', 'Talk', MessageCircle],
  ['memory', 'Memory', Database],
  ['graph', 'Graph', Network],
  ['projects', 'Projects', FolderKanban],
  ['goals', 'Goals', Target],
  ['planning', 'Plan', ListChecks],
  ['engines', 'Engines', Cpu],
  ['activity', 'Log', ActivityIcon],
  ['briefing', 'Briefing', Sun],
  ['settings', 'Settings', SettingsIcon],
  ['core', 'Core', Shield],
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [mode, setMode] = useState('Talk');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => observeCoreUser((nextUser) => {
    setUser(nextUser);
    setAuthReady(true);
  }), []);

  if (!authReady) {
    return <main className="app"><section className="briefing"><h2>Starting Cloud Brain...</h2><p className="muted">Checking Firebase Auth.</p></section></main>;
  }

  if (!user) return <AuthPanel />;

  const screen =
    tab === 'home' ? <Home mode={mode} /> :
    tab === 'talk' ? <Talk mode={mode} /> :
    tab === 'memory' ? <Memory /> :
    tab === 'graph' ? <LifeGraph /> :
    tab === 'projects' ? <Projects /> :
    tab === 'goals' ? <Goals /> :
    tab === 'planning' ? <Planning /> :
    tab === 'engines' ? <Engines /> :
    tab === 'activity' ? <Activity /> :
    tab === 'briefing' ? <Briefing /> :
    tab === 'settings' ? <Settings /> :
    <Core />;

  return (
    <main className={`app mode-${mode.toLowerCase()}`}>
      <header className="topbar">
        <div className="brand">
          <Brain />
          <div>
            <strong>CORE SELF</strong>
            <span>Dylan Core Genesis 0.1.0 • Cloud Brain</span>
          </div>
        </div>
        <div className="statusCluster"><span className="online">Cloud Brain Online</span><button className="iconButton" onClick={() => signOutCore()} title="Sign out"><LogOut size={16} /></button></div>
      </header>

      <ModeBar mode={mode} setMode={setMode} />

      {screen}

      <nav className="nav">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
