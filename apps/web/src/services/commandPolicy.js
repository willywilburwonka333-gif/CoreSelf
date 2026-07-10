const DIRECT_PATTERNS = [
  { intent: 'image_generate', label: 'Create image', regex: /\b(make|create|generate|draw|design|render|produce)\b[\s\S]{0,80}\b(image|picture|photo|poster|logo|banner|thumbnail|cover|wallpaper|icon|graphic|artwork|visual)\b/i },
  { intent: 'file_analyse', label: 'Analyse file', regex: /\b(analyse|analyze|read|summari[sz]e|inspect|review|check|explain)\b[\s\S]{0,80}\b(file|pdf|document|doc|image|photo|screenshot|zip|code|attachment)\b/i },
  { intent: 'web_search', label: 'Search web', regex: /\b(search|look up|google|check online|latest|current|recent|verify|find sources|internet|web)\b/i },
  { intent: 'code_work', label: 'Code/build', regex: /\b(build|fix|debug|code|patch|replace|component|route|api|deploy|npm|vite|react|jsx|css|zip)\b/i },
  { intent: 'write_create', label: 'Write/create', regex: /\b(write|draft|make|create|prepare|generate)\b[\s\S]{0,120}\b(plan|document|email draft|copy|caption|lyrics|prompt|outline|proposal|business plan|forecast|story)\b/i },
];

const CONFIRM_PATTERNS = [
  { intent: 'send_message', label: 'Send/contact outside world', regex: /\b(send|email|message|text|dm|contact|reply to|post)\b/i },
  { intent: 'money', label: 'Spend money/payment', regex: /\b(buy|purchase|pay|subscribe|upgrade|spend|order|book and pay)\b/i },
  { intent: 'destructive', label: 'Delete/overwrite important data', regex: /\b(delete|remove|wipe|erase|destroy|overwrite|reset production|drop database)\b/i },
  { intent: 'production_change', label: 'Production/GitHub/Firebase change', regex: /\b(push|commit|deploy|release|publish|change firebase|update firestore|production|merge)\b/i },
  { intent: 'background_auto', label: 'Background automation', regex: /\b(every day|every morning|monitor|watch|automatically|background|while I|notify me when|remind me)\b/i },
];

export function classifyCommand(input = '', { hasAttachments = false } = {}) {
  const text = String(input || '').trim();
  const lower = text.toLowerCase();
  const direct = DIRECT_PATTERNS.find((item) => item.regex.test(text));
  const confirmation = CONFIRM_PATTERNS.find((item) => item.regex.test(text));

  if (confirmation) {
    return {
      mode: 'confirm',
      intent: confirmation.intent,
      label: confirmation.label,
      reason: 'This could affect outside systems, people, money, production, data, or background automation.',
      userVisible: 'Approval needed before I do that outside Core Self.',
    };
  }

  if (direct) {
    return {
      mode: 'execute',
      intent: direct.intent,
      label: direct.label,
      reason: 'Direct command inside Core Self. Execute without approval.',
      userVisible: `Working: ${direct.label}.`,
    };
  }

  if (hasAttachments) {
    return {
      mode: 'execute',
      intent: 'file_analyse',
      label: 'Analyse attachment',
      reason: 'Attachment included. Analyse directly.',
      userVisible: 'Working: analysing attachment.',
    };
  }

  if (/\b(make me|do it|fix it|build it|create it|write it|analyse this|analyze this|read this)\b/i.test(lower)) {
    return {
      mode: 'execute',
      intent: 'general_execute',
      label: 'Direct command',
      reason: 'The user gave an imperative command.',
      userVisible: 'Working.',
    };
  }

  return {
    mode: 'answer',
    intent: 'conversation',
    label: 'Answer',
    reason: 'Normal conversation or planning request.',
    userVisible: 'Thinking.',
  };
}

export function requiresApproval(input = '') {
  return classifyCommand(input).mode === 'confirm';
}

export function policySummary() {
  return {
    executeWithoutApproval: DIRECT_PATTERNS.map((item) => item.label),
    requireApproval: CONFIRM_PATTERNS.map((item) => item.label),
  };
}
