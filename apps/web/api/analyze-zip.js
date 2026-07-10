function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function base64FromDataUrl(value = '') {
  const raw = String(value || '');
  const comma = raw.indexOf(',');
  return comma >= 0 ? raw.slice(comma + 1) : raw;
}

function readZipNames(buffer) {
  const names = [];
  const signature = 0x02014b50;
  for (let offset = 0; offset < buffer.length - 46 && names.length < 250; offset += 1) {
    if (buffer.readUInt32LE(offset) !== signature) continue;
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > buffer.length) continue;
    const name = buffer.slice(nameStart, nameEnd).toString('utf8');
    if (name && !names.includes(name)) names.push(name);
    offset = nameEnd + extraLength + commentLength - 1;
  }
  return names;
}

function classifyArchive(files = []) {
  const lower = files.map((item) => item.toLowerCase());
  const hasPackage = lower.some((item) => item.endsWith('package.json'));
  const hasReact = lower.some((item) => item.endsWith('.jsx') || item.endsWith('.tsx') || item.includes('/src/'));
  const hasVercel = lower.some((item) => item.endsWith('vercel.json'));
  const hasFirebase = lower.some((item) => item.includes('firebase') || item.endsWith('firestore.rules'));
  const hasDocs = lower.some((item) => item.endsWith('.md') || item.endsWith('.pdf') || item.endsWith('.docx'));
  const findings = [];
  if (hasPackage) findings.push('Looks like a JavaScript/Node project.');
  if (hasReact) findings.push('React/Vite-style source files detected.');
  if (hasVercel) findings.push('Vercel deployment config detected.');
  if (hasFirebase) findings.push('Firebase/Firestore files detected.');
  if (hasDocs) findings.push('Documentation/content files detected.');
  return findings;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  const file = req.body?.file || {};
  const dataUrl = String(file.routeDataUrl || '');

  if (!dataUrl) {
    return sendJson(res, 200, {
      ok: true,
      fileName: file.name || 'archive',
      kind: 'archive',
      summary: `Archive received (${file.sizeLabel || 'unknown size'}). File was too large or not routed, so only metadata is available.`,
      nextAction: 'Upload a ZIP under 6 MB or split the project so Dylan Core can list files.',
    });
  }

  try {
    const buffer = Buffer.from(base64FromDataUrl(dataUrl), 'base64');
    const files = readZipNames(buffer);
    const findings = classifyArchive(files);
    return sendJson(res, 200, {
      ok: true,
      fileName: file.name || 'archive',
      kind: 'archive',
      summary: files.length ? `ZIP analysed. Found ${files.length} file/path entries.` : 'Archive received but no ZIP central-directory file list could be read.',
      files,
      findings,
      nextAction: files.length ? 'Ask Dylan Core to inspect the file list, identify likely source files, or plan a patch.' : 'Confirm this is a standard ZIP file and retry.',
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      fileName: file.name || 'archive',
      kind: 'archive',
      summary: error.message || 'ZIP analysis failed safely.',
      nextAction: 'Retry with a smaller standard ZIP or check server logs.',
    });
  }
}
