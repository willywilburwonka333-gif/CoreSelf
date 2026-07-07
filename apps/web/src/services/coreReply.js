export function coreReply(input, mode) {
  const text = input.toLowerCase();

  if (text.includes('next')) {
    return 'Next: strengthen Memory and the Life Graph. That is the foundation of Dylan Core.';
  }

  if (text.includes('remember') || text.includes('save')) {
    return 'Memory noted. This is the kind of information Dylan Core should learn and preserve.';
  }

  if (mode === 'Wealth') {
    return 'Wealth Mode: maximise sustainable income and freedom while protecting family time and downside risk.';
  }

  if (mode === 'Build') {
    return 'Build Mode: turn ideas into working software, clean systems, and assets.';
  }

  if (mode === 'Create') {
    return 'Create Mode: turn ideas into books, songs, apps, anime, stories, and IP.';
  }

  return 'I am Dylan Core Genesis. My purpose is to help Dylan become his highest possible self.';
}
