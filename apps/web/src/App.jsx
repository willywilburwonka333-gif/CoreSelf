import { useState } from 'react';
import { Activity as ActivityIcon, Brain, Home as HomeIcon, MessageCircle, Database, Network, Sun, Shield, FolderKanban, Target, Cpu, Settings as SettingsIcon } from 'lucide-react';
import ModeBar from './components/ModeBar';
import Home from './screens/Home';
import Talk from './screens/Talk';
import Memory from './screens/Memory';
import LifeGraph from './screens/LifeGraph';
import Briefing from './screens/Briefing';
import Core from './screens/Core';
import Projects from './screens/Projects';
import Goals from './screens/Goals';
import Engines from './screens/Engines';
import Activity from './screens/Activity';
import Settings from './screens/Settings';

const tabs = [
  ['home', 'Home', HomeIcon],
  ['talk', 'Talk', MessageCircle],
  ['memory', 'Memory', Database],
  ['graph', 'Graph', Network],
  ['projects', 'Projects', FolderKanban],
  ['goals', 'Goals', Target],
  ['engines', 'Engines', Cpu],
  ['activity', 'Log', ActivityIcon],
  ['briefing', 'Briefing', Sun],
  ['settings', 'Settings', SettingsIcon],
  ['core', 'Core', Shield],
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [mode, setMode] = useState('Talk');

  const screen =
    tab === 'home' ? <Home mode={mode} /> :
    tab === 'talk' ? <Talk mode={mode} /> :
    tab === 'memory' ? <Memory /> :
    tab === 'graph' ? <LifeGraph /> :
    tab === 'projects' ? <Projects /> :
    tab === 'goals' ? <Goals /> :
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
            <span>Dylan Core Genesis 0.0.6</span>
          </div>
        </div>
        <span className="online">Core Online</span>
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
