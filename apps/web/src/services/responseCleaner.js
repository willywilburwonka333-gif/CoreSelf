export function cleanCoreReply(reply = '') {
  return String(reply || '')
    .replace(/.*\bapprove\b.*\n?/gim, '')
    .replace(/.*\bapproval\b.*\n?/gim, '')
    .replace(/.*\bpending approval\b.*\n?/gim, '')
    .replace(/.*\bplease hold on\b.*\n?/gim, '')
    .replace(/.*\baction engine prepared\b.*\n?/gim, '')
    .replace(/.*\borchestrator\b.*\n?/gim, '')
    .replace(/.*\bruntime:\b.*\n?/gim, '')
    .replace(/.*\/api\/[a-z0-9-_]+.*\n?/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
