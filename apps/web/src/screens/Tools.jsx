import { useMemo, useState } from 'react';
import { load } from '../services/localStore';
import { loadToolRegistry, saveToolRegistry, buildToolReadiness, createToolExecution } from '../services/toolRegistry';
import { buildStabilityReport, buildSafeExecutionRules } from '../services/stabilityEngine';

export default function Tools() {
  const [tools, setTools] = useState(loadToolRegistry());
  const [executions, setExecutions] = useState(load('toolExecutionLog', []));

  const memories = load('memories', []);
  const projects = load('projects', []);
  const goals = load('goals', []);
  const suggestions = load('memorySuggestions', []);
  const activityLog = load('activityLog', []);
  const messages = load('messages', []);
  const queue = load('actionQueue', []);

  const readiness = useMemo(() => buildToolReadiness(tools), [tools]);
  const stability = useMemo(() => buildStabilityReport({ memories, projects, goals, suggestions, activityLog, messages, queue, tools }), [memories, projects, goals, suggestions, activityLog, messages, queue, tools]);
  const rules = useMemo(() => buildSafeExecutionRules(stability), [stability]);

  function updateTool(tool, changes) {
    const next = tools.map((item) => item.id === tool.id ? { ...item, ...changes } : item);
    setTools(next);
    saveToolRegistry(next);
  }

  function runTool(tool) {
    const execution = createToolExecution(tool, { source: 'Tools screen', mode: 'manual approval' });
    setExecutions([execution, ...executions].slice(0, 100));
  }

  return (
    <section className="screen">
      <div className="talkHeader">
        <div>
          <p className="eyebrow">TOOLS / GENESIS 0.9.2</p>
          <h2>Tool Registry</h2>
        </div>
      </div>

      <div className="briefing">
        <h3>{readiness.mode}</h3>
        <p>{readiness.summary}</p>
        <p className="muted">Ready: {readiness.ready} • Allowed: {readiness.allowed} • Executable: {readiness.executable} • Needs setup: {readiness.needsSetup} • Locked: {readiness.locked}</p>
      </div>

      <div className="briefing">
        <h3>Safe Execution Rules</h3>
        <ul>
          {rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      </div>

      <div className="briefing">
        <h3>Stability Gate</h3>
        <p><strong>{stability.status}</strong> — {stability.score}%</p>
        {stability.blockers.length ? <ul>{stability.blockers.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">No major tool blockers detected.</p>}
      </div>

      <div className="list">
        {tools.map((tool) => (
          <article key={tool.id}>
            <div className="itemTopline">
              <strong>{tool.name}</strong>
              <small>{tool.category} • {tool.status} • {tool.permission}</small>
            </div>
            <p>{tool.capability}</p>
            <p><strong>Risk:</strong> {tool.risk}</p>
            <div className="miniActionButtons">
              <button type="button" onClick={() => updateTool(tool, { permission: tool.permission === 'Allowed' ? 'Ask first' : 'Allowed' })}>{tool.permission === 'Allowed' ? 'Require Approval' : 'Allow Internal'}</button>
              <button type="button" onClick={() => updateTool(tool, { status: tool.status === 'Ready' ? 'Needs setup' : 'Ready' })}>{tool.status === 'Ready' ? 'Mark Setup Needed' : 'Mark Ready'}</button>
              <button type="button" onClick={() => runTool(tool)}>Record Test</button>
            </div>
          </article>
        ))}
      </div>

      <div className="briefing">
        <h3>Execution History</h3>
        {executions.length ? executions.slice(0, 8).map((item) => (
          <div className="miniActionCard" key={item.id}>
            <div className="itemTopline"><strong>{item.toolName}</strong><small>{item.status}</small></div>
            <p>{item.result}</p>
            <small>{new Date(item.requestedAt).toLocaleString()}</small>
          </div>
        )) : <p className="muted">No tool executions recorded yet.</p>}
      </div>
    </section>
  );
}
