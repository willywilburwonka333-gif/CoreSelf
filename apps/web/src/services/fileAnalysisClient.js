export async function analyseAttachments(attachments = []) {
  if (!attachments.length) return { ok: true, results: [] };
  const results = [];

  for (const file of attachments) {
    try {
      const endpoint = file.kind === 'archive' ? '/api/analyze-zip' : '/api/analyze-file';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file }),
      });
      const data = await response.json().catch(() => ({}));
      results.push(response.ok && data.ok ? data : {
        ok: false,
        fileName: file.name,
        kind: file.kind,
        summary: data.error || `Analyzer route failed with status ${response.status}.`,
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
  return results.map((item) => `${item.fileName || 'File'}: ${item.summary || item.kind || 'attached'}`).join('\n');
}
