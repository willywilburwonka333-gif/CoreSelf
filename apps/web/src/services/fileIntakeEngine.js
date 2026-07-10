const MAX_ROUTE_BYTES = 6 * 1024 * 1024;
const MAX_TEXT_CHARS = 32000;
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'csv', 'xml', 'yml', 'yaml', 'log', 'env', 'gitignore']);

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
    reader.onload = () => resolve(String(reader.result || '').slice(0, MAX_TEXT_CHARS));
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

function canRouteData(file = {}, kind = '') {
  if ((file.size || 0) > MAX_ROUTE_BYTES) return false;
  return ['image', 'pdf', 'archive', 'document'].includes(kind);
}

export async function prepareFileAttachments(files = []) {
  try {
    const attachments = [];
    for (const file of files.slice(0, 8)) {
      const kind = kindFor(file);
      const ext = extensionFor(file);
      const base = {
        id: crypto.randomUUID(),
        name: file.name,
        extension: ext,
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        sizeLabel: sizeLabel(file.size || 0),
        kind,
        routeReady: true,
        intakeNote: `${kind} attached and ready for Dylan Core.`,
      };

      if (kind === 'text') {
        attachments.push({ ...base, textPreview: await readAsText(file) });
        continue;
      }

      if (canRouteData(file, kind)) {
        const dataUrl = await readAsDataUrl(file);
        attachments.push({
          ...base,
          previewUrl: kind === 'image' ? dataUrl : undefined,
          routeDataUrl: dataUrl,
          routeReady: Boolean(dataUrl),
        });
        continue;
      }

      attachments.push({
        ...base,
        routeReady: false,
        intakeNote: `${kind} attached. File is too large for browser-to-route analysis, but metadata is available.`,
      });
    }
    return { ok: true, attachments };
  } catch (error) {
    return { ok: false, reason: error.message || 'File intake failed safely.' };
  }
}
