export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  const file = req.body?.file || {};
  const name = file.name || 'attached file';
  const kind = file.kind || 'file';
  const size = file.sizeLabel || 'unknown size';
  const text = String(file.textPreview || '').trim();

  let summary = `${kind} received (${size}).`;
  if (kind === 'image') summary = `Image ready for visual analysis or editing (${size}).`;
  if (kind === 'pdf') summary = `PDF received. Deeper PDF text extraction is staged for the next analyser pass.`;
  if (kind === 'text' && text) summary = `Text/code readable now. Preview: ${text.slice(0, 260)}${text.length > 260 ? '…' : ''}`;
  if (kind === 'document') summary = `Document received. Metadata is ready; deep document parsing is staged for the next analyser pass.`;

  return res.status(200).json({ ok: true, fileName: name, kind, summary });
}
