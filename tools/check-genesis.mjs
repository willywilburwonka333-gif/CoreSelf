import fs from 'node:fs';

const required = [
  'apps/web/index.html',
  'apps/web/src/main.jsx',
  'apps/web/src/App.jsx',
  'apps/web/src/styles/main.css',
  'docs/01_Constitution.md',
  'docs/02_Architecture.md'
];

const missing = required.filter((file) => !fs.existsSync(new URL(`../${file}`, import.meta.url)));

if (missing.length) {
  console.error('Missing required Genesis files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

console.log('Core Self Genesis check passed.');
