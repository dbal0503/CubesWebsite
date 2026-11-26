// localStorage so a refresh or a locked phone doesn't lose the game. Private
// mode or blocked storage still plays; it just won't survive a reload.

export function readStored<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // See above.
  }
}
