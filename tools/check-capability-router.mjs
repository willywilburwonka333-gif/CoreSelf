import fs from 'node:fs';
import { buildOfflineReply } from '../apps/web/src/services/offlineBrain.js';

const required = [
  'apps/web/src/services/modelRoutingPolicy.js',
  'apps/web/src/services/providerConnectionEngine.js',
  'apps/web/api/chat.js',
  'apps/web/api/ai-status.js',
  'apps/web/src/services/identityCore.js',
  'apps/web/src/screens/Core.jsx',
  'apps/web/src/services/offlineBrain.js',
  'apps/web/public/sw.js',
  'apps/web/src/services/selfRuntimeEngine.js',
  'apps/web/src/services/digitalTwinEngine.js',
  'apps/web/src/services/executionLearningEngine.js',
  'apps/web/src/services/memoryIntelligenceEngine.js',
  'apps/web/src/styles/genesis14.css',
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
const identity = fs.readFileSync(new URL('../apps/web/src/services/identityCore.js', import.meta.url), 'utf8');
const talk = fs.readFileSync(new URL('../apps/web/src/screens/Talk.jsx', import.meta.url), 'utf8');
const router = fs.readFileSync(new URL('../apps/web/src/services/aiRouter.js', import.meta.url), 'utf8');
const offline = fs.readFileSync(new URL('../apps/web/src/services/offlineBrain.js', import.meta.url), 'utf8');
const serviceWorker = fs.readFileSync(new URL('../apps/web/public/sw.js', import.meta.url), 'utf8');
const selfRuntime = fs.readFileSync(new URL('../apps/web/src/services/selfRuntimeEngine.js', import.meta.url), 'utf8');
const digitalTwin = fs.readFileSync(new URL('../apps/web/src/services/digitalTwinEngine.js', import.meta.url), 'utf8');
const executionLearning = fs.readFileSync(new URL('../apps/web/src/services/executionLearningEngine.js', import.meta.url), 'utf8');
const memoryIntelligence = fs.readFileSync(new URL('../apps/web/src/services/memoryIntelligenceEngine.js', import.meta.url), 'utf8');
const genesis14Css = fs.readFileSync(new URL('../apps/web/src/styles/genesis14.css', import.meta.url), 'utf8');
const offlineMusicReply = buildOfflineReply({
  input: 'What do you know about my music and Wilbur Wonka?',
  identityProfile: {
    creativeProfile: {
      identity: ['Wilbur Wonka is Dylan Corr’s original Australian hybrid artist identity.'],
    },
  },
  projects: [{ name: 'Wilbur Wonka', nextAction: 'Review the release plan.' }],
});
const offlineProjectReply = buildOfflineReply({
  input: 'What is next for Core Self?',
  projects: [{ name: 'Core Self', nextAction: 'Review the release plan.' }],
});

const assertions = [
  [policy.includes("profile: 'internet'"), 'internet profile'],
  [policy.includes("profile: 'coding'"), 'coding profile'],
  [policy.includes("profile: 'deep'"), 'deep profile'],
  [policy.includes("['gemini', 'openai']"), 'cost-aware standard route'],
  [chat.includes('callGeminiChat'), 'Gemini server adapter'],
  [chat.includes('fallbackProvider'), 'provider fallback'],
  [status.includes('publicRoutingSummary'), 'safe routing diagnostics'],
  [identity.includes('DEFAULT_IDENTITY_PROFILE'), 'confirmed Dylan identity profile'],
  [identity.includes("confidence: 'Needs Dylan confirmation'"), 'identity learning confirmation gate'],
  [identity.includes('privateContext'), 'private Dylan Seed Vault support'],
  [identity.includes('creativeProfile'), 'built-in Wilbur Wonka music profile'],
  [identity.includes('seed-wilbur-wonka-music') || fs.readFileSync(new URL('../apps/web/src/data/coreSeeds.js', import.meta.url), 'utf8').includes('seed-wilbur-wonka-music'), 'permanent Wilbur Wonka music memory'],
  [talk.includes('addIdentitySuggestion'), 'Talk identity learning loop'],
  [chat.includes('CONFIRMED DYLAN IDENTITY CORE'), 'identity-aware model context'],
  [router.includes('buildOfflineReply'), 'offline rule-engine route'],
  [offline.includes('privateContext'), 'offline private identity grounding'],
  [offlineMusicReply.includes('original Australian hybrid artist identity'), 'music question uses built-in identity offline'],
  [offlineProjectReply.includes('Relevant active work'), 'project question still uses project path offline'],
  [serviceWorker.includes("caches.match('/')"), 'offline app shell'],
  [serviceWorker.includes('core-self-genesis-1-4'), 'Genesis 1.4 offline cache'],
  [selfRuntime.includes('buildSecondSelfRuntime'), 'integrated second-self runtime'],
  [selfRuntime.includes("label: 'Reflect'"), 'perceive-to-reflect runtime loop'],
  [digitalTwin.includes('buildDigitalTwin'), 'connected digital twin'],
  [executionLearning.includes('recordExecutionOutcome'), 'execution-learning loop'],
  [memoryIntelligence.includes('findMemoryDuplicates'), 'memory integrity duplicate review'],
  [memoryIntelligence.includes('findMemoryContradictions'), 'memory contradiction review'],
  [chat.includes('Second-Self runtime:'), 'second-self runtime reaches model context'],
  [chat.includes('Digital twin:'), 'digital twin reaches model context'],
  [genesis14Css.includes('.coreReactor'), 'Genesis 1.4 futuristic command interface'],
];

const failed = assertions.filter(([ok]) => !ok).map(([, label]) => label);
if (failed.length) {
  console.error(`Capability router check failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('Core Self capability router check passed.');
