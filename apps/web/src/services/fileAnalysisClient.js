export async function analyseAttachments(attachments = [], userPrompt = '') {
  if (!attachments.length) return { ok: true, results: [] };
  const results = [];

  for (const file of attachments) {
    try {
      const endpoint = file.kind === 'archive' ? '/api/analyze-zip' : '/api/analyze-file';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, prompt: userPrompt }),
      });
      const data = await response.json().catch(() => ({}));
      results.push(response.ok && data.ok ? data : {
        ok: false,
        fileName: file.name,
        kind: file.kind,
        summary: data.error || `Analyzer route failed with status ${response.status}.`,
        nextAction: data.nextAction || 'Retry after deploy or check the server logs.',
      });
    } catch (error) {
      results.push({ ok: false, fileName: file.name, kind: file.kind, summary: error.message || 'Analyzer route failed safely.' });
    }
  }

  return { ok: true, results };
}

export function summarizeFileAnalysisResults(analysis = null) {
  const results = analysis?.results || [];
  if (!results.length) return '';
  return results.map((item) => {
    const header = `${item.fileName || 'File'}: ${item.summary || item.kind || 'attached'}`;
    const details = [];
    if (item.findings?.length) details.push(`Findings: ${item.findings.slice(0, 6).join(' | ')}`);
    if (item.files?.length) details.push(`Archive files: ${item.files.slice(0, 24).join(', ')}${item.files.length > 24 ? `, +${item.files.length - 24} more` : ''}`);
    if (item.codeStats) details.push(`Code stats: ${item.codeStats.lines} lines, ${item.codeStats.characters} chars, ${item.codeStats.exports} exports, ${item.codeStats.imports} imports.`);
    if (item.nextAction) details.push(`Next: ${item.nextAction}`);
    return [header, ...details].join('\n');
  }).join('\n\n');
}
