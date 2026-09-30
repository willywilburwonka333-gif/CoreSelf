import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, BrainCircuit, Home as HomeIcon, MessageCircle, Database, Network, Sun, Shield, FolderKanban, Target, Cpu, Settings as SettingsIcon, ListChecks, LogOut, ShieldCheck, MoreHorizontal, CheckSquare, Wrench } from 'lucide-react';
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
import Actions from './screens/Actions';
import Tools from './screens/Tools';
import Settings from './screens/Settings';
import Security from './screens/Security';
import AuthPanel from './components/AuthPanel';
import { observeCoreUser, signOutCore } from './services/authService';

const primaryTabs = [
  ['home', 'Core', HomeIcon],
  ['talk', 'Talk', MessageCircle],
  ['memory', 'Memory', Database],
  ['actions', 'Actions', CheckSquare],
];

const moreTabs = [
  ['projects', 'Projects', FolderKanban],
  ['goals', 'Goals', Target],
  ['graph', 'Graph', Network],
  ['planning', 'Plan', ListChecks],
  ['engines', 'Engines', Cpu],
  ['tools', 'Tools', Wrench],
  ['activity', 'Log', ActivityIcon],
  ['briefing', 'Briefing', Sun],
  ['settings', 'Settings', SettingsIcon],
  ['security', 'Security', ShieldCheck],
  ['core', 'Identity', Shield],
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [mode, setMode] = useState('Talk');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => observeCoreUser((nextUser) => {
    setUser(nextUser);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  if (!authReady) {
    return (
      <main className="app">
        <section className="briefing">
          <p className="eyebrow">CORE SELF / BOOT SEQUENCE</p>
          <h2>Starting Dylan Core…</h2>
          <p className="muted">Restoring identity, memory and Cloud Brain session.</p>
        </section>
      </main>
    );
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
    tab === 'actions' ? <Actions /> :
    tab === 'tools' ? <Tools /> :
    tab === 'engines' ? <Engines /> :
    tab === 'activity' ? <Activity /> :
    tab === 'briefing' ? <Briefing /> :
    tab === 'settings' ? <Settings /> :
    tab === 'security' ? <Security /> :
    <Core />;

  function chooseTab(id) {
    setTab(id);
    setMoreOpen(false);
  }

  return (
    <main className={`app mode-${mode.toLowerCase()}`}>
      <header className="topbar">
        <div className="brand">
          <div className="brandMark"><BrainCircuit size={19} /></div>
          <div>
            <strong>CORE SELF</strong>
            <span className="genesisTag"><i /> Dylan Core · Genesis 1.4 · Second-Self Runtime</span>
          </div>
        </div>
        <div className="statusCluster">
          <span className={isOnline ? 'online' : 'offline'}>{isOnline ? 'Neural Link Online' : 'Offline Core'}</span>
          <button className="iconButton" onClick={() => signOutCore()} title="Sign out"><LogOut size={15} /></button>
        </div>
      </header>

      <ModeBar mode={mode} setMode={setMode} />

      {screen}

      {moreOpen && (
        <div className="moreNavPanel">
          {moreTabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => chooseTab(id)}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <nav className="nav compactNav">
        {primaryTabs.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => chooseTab(id)}>
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
        <button className={moreOpen || moreTabs.some(([id]) => id === tab) ? 'active' : ''} onClick={() => setMoreOpen((value) => !value)}>
          <MoreHorizontal size={17} />
          <span>More</span>
        </button>
      </nav>
    </main>
  );
}
