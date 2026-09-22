import fs from 'node:fs';

const required = [
  'apps/web/src/services/modelRoutingPolicy.js',
  'apps/web/src/services/providerConnectionEngine.js',
  'apps/web/api/chat.js',
  'apps/web/api/ai-status.js',
];

for (const file of required) {
  if (!fs.existsSync(new URL(`../${file}`, import.meta.url))) {
    console.error(`Missing capability-router file: ${file}`);
    process.exit(1);
  }
}

const policy = fs.readFileSync(new URL('../apps/web/src/services/modelRoutingPolicy.js', import.meta.url), 'utf8');
const chat = fs.readFileSync(new URL('../apps/web/api/chat.js', import.meta.url), 'utf8');
const status = fs.readFileSync(new URL('../apps/web/api/ai-status.js', import.meta.url), 'utf8');

const assertions = [
  [policy.includes("profile: 'internet'"), 'internet profile'],
  [policy.includes("profile: 'coding'"), 'coding profile'],
  [policy.includes("profile: 'deep'"), 'deep profile'],
  [policy.includes("['gemini', 'openai']"), 'cost-aware standard route'],
  [chat.includes('callGeminiChat'), 'Gemini server adapter'],
  [chat.includes('fallbackProvider'), 'provider fallback'],
  [status.includes('publicRoutingSummary'), 'safe routing diagnostics'],
];

const failed = assertions.filter(([ok]) => !ok).map(([, label]) => label);
if (failed.length) {
  console.error(`Capability router check failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('Core Self capability router check passed.');
