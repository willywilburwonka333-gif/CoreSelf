import { detectRelationshipTags } from './relationshipEngine';

const importantSignals = ['remember', 'save', 'from now on', 'going forward', 'next time', 'always', 'never', 'important', 'don\'t forget', 'project', 'goal', 'plan', 'deadline', 'family', 'money', 'health'];

function inferType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('project') || lower.includes('app') || lower.includes('build')) return 'Project';
  if (lower.includes('goal') || lower.includes('want to') || lower.includes('need to')) return 'Goal';
  if (lower.includes('lesson') || lower.includes('learned')) return 'Lesson';
  if (lower.includes('always') || lower.includes('never') || lower.includes('prefer')) return 'Preference';
  if (lower.includes('risk') || lower.includes('warning') || lower.includes('problem')) return 'Warning';
  return 'Dylan Memory';
}

function inferImportance(text) {
  const lower = text.toLowerCase();
  if (['permanent', 'critical', 'always', 'never', 'family', 'money', 'business', 'health'].some((word) => lower.includes(word))) return 'Critical';
  if (['important', 'project', 'goal', 'deadline', 'next'].some((word) => lower.includes(word))) return 'High';
  return 'Medium';
}

export function suggestMemoryFromMessage(input, existingSuggestions = []) {
  const clean = String(input || '').trim();
  if (clean.length < 18) return null;

  const lower = clean.toLowerCase();
  const hasSignal = importantSignals.some((signal) => lower.includes(signal));
  const hasEnoughWeight = clean.length > 70 || detectRelationshipTags(clean).length > 0;
  if (!hasSignal && !hasEnoughWeight) return null;

  const title = clean.length > 62 ? `${clean.slice(0, 59)}...` : clean;
  const duplicate = existingSuggestions.some((item) => item.content?.toLowerCase() === clean.toLowerCase() && item.status === 'Pending');
  if (duplicate) return null;

  return {
    id: crypto.randomUUID(),
    status: 'Pending',
    type: inferType(clean),
    level: inferImportance(clean) === 'Critical' ? 'Permanent' : 'Active',
    importance: inferImportance(clean),
    title,
    content: clean,
    lesson: '',
    futureAction: lower.includes('next') || lower.includes('plan') || lower.includes('goal') ? 'Review during planning.' : '',
    relationshipTags: detectRelationshipTags(clean),
    createdAt: new Date().toISOString(),
    source: 'Talk suggestion',
  };
}

export function acceptSuggestion(suggestion) {
  return {
    id: crypto.randomUUID(),
    type: suggestion.type || 'Dylan Memory',
    level: suggestion.level || 'Active',
    importance: suggestion.importance || 'High',
    title: suggestion.title,
    content: suggestion.content,
    lesson: suggestion.lesson || '',
    futureAction: suggestion.futureAction || '',
    relationshipTags: suggestion.relationshipTags || detectRelationshipTags(suggestion.content),
    truthStatus: 'Confirmed by Dylan',
    createdAt: new Date().toISOString(),
    source: suggestion.source || 'Suggestion',
  };
}
