const MAX_PREVIEW_BYTES = 6 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'csv', 'xml', 'yml', 'yaml', 'log']);

function extensionFor(file = {}) {
  const name = String(file.name || '');
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function kindFor(file = {}) {
  const type = String(file.type || '');
  const ext = extensionFor(file);
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('video/')) return 'video';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'document';
  if (TEXT_EXTENSIONS.has(ext) || type.startsWith('text/')) return 'text';
  return 'file';
}

function sizeLabel(bytes = 0) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function readAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').slice(0, 12000));
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

export async function prepareFileAttachments(files = []) {
  try {
    const attachments = [];
    for (const file of files.slice(0, 8)) {
      const kind = kindFor(file);
      const base = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        sizeLabel: sizeLabel(file.size || 0),
        kind,
        routeReady: true,
        intakeNote: `${kind} attached and ready for Dylan Core.`,
      };

      if (kind === 'image' && file.size <= MAX_PREVIEW_BYTES) {
        const dataUrl = await readAsDataUrl(file);
        attachments.push({ ...base, previewUrl: dataUrl, routeDataUrl: dataUrl });
      } else if (kind === 'text') {
        attachments.push({ ...base, textPreview: await readAsText(file) });
      } else {
        attachments.push(base);
      }
    }
    return { ok: true, attachments };
  } catch (error) {
    return { ok: false, reason: error.message || 'File intake failed safely.' };
  }
}
