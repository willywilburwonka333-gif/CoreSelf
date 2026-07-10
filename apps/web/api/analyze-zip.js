export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  const file = req.body?.file || {};
  return res.status(200).json({
    ok: true,
    fileName: file.name || 'archive',
    kind: 'archive',
    summary: `Archive received (${file.sizeLabel || 'unknown size'}). ZIP content listing/extraction is staged for the next analyser pass.`,
  });
}
