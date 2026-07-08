export function buildStabilityReport({ memories = [], projects = [], goals = [], suggestions = [], activityLog = [], messages = [], queue = [], tools = [] } = {}) {
  const warnings = [];
  const blockers = [];
  const checks = [];

  const addCheck = (label, pass, detail) => {
    checks.push({ label, pass, detail });
    if (!pass) warnings.push(detail || label);
  };

  addCheck('Memory store readable', Array.isArray(memories), 'Memory data is not an array.');
  addCheck('Projects readable', Array.isArray(projects), 'Project data is not an array.');
  addCheck('Goals readable', Array.isArray(goals), 'Goal data is not an array.');
  addCheck('Action queue readable', Array.isArray(queue), 'Action queue is not an array.');
  addCheck('Activity log readable', Array.isArray(activityLog), 'Activity log is not an array.');
  addCheck('Message history readable', Array.isArray(messages), 'Message history is not an array.');
  addCheck('Tool registry readable', Array.isArray(tools), 'Tool registry is not an array.');

  const duplicateQueueIds = queue.length - new Set(queue.map((item) => item.id).filter(Boolean)).size;
  if (duplicateQueueIds > 0) warnings.push(`${duplicateQueueIds} queued action(s) may have duplicate IDs.`);

  const pendingSuggestions = suggestions.filter((item) => item.status === 'Pending').length;
  if (pendingSuggestions > 12) warnings.push('Many pending memory suggestions. Review them before adding more automation.');

  const executableTools = tools.filter((tool) => tool.status === 'Ready' && tool.permission === 'Allowed');
  const needsSetup = tools.filter((tool) => tool.status === 'Needs setup');
  if (!executableTools.length) blockers.push('No tools are approved for execution yet. Dylan can plan tools, but should not pretend external actions are live.');
  if (needsSetup.length) warnings.push(`${needsSetup.length} tool(s) need setup before real execution.`);

  const score = Math.max(0, Math.min(100, 100 - warnings.length * 8 - blockers.length * 18));
  return {
    score,
    status: blockers.length ? 'Guarded' : warnings.length ? 'Stable with warnings' : 'Stable',
    checks,
    warnings,
    blockers,
    executableToolCount: executableTools.length,
    needsSetupCount: needsSetup.length,
    openQueueCount: queue.filter((item) => item.status !== 'Done').length,
  };
}

export function buildSafeExecutionRules(report = {}) {
  const rules = [
    'Never claim a tool has run unless an execution record exists.',
    'External actions require user approval first.',
    'If a tool is Needs setup or Locked, show setup steps instead of pretending it works.',
    'Keep failed action results visible so the user can recover quickly.',
  ];
  if (report.blockers?.length) rules.unshift('Current mode is guarded: planning is allowed, real external execution is not ready.');
  return rules;
}
