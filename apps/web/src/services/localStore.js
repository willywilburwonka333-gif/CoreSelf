const prefix = 'core-self-genesis:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(prefix + key, JSON.stringify(value));
}

export function remove(key) {
  localStorage.removeItem(prefix + key);
}
