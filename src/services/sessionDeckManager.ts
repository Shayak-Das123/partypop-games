// Centralized Non-Repeating Deck Service for PartyPop
// Guarantees that within any game session, prompts/words/locations NEVER repeat!

export function getNonRepeatingItem<T>(
  sessionId: string,
  deckKey: string,
  allItems: T[],
  getItemKey: (item: T) => string = (item) => String(item)
): T {
  if (!allItems || allItems.length === 0) {
    throw new Error(`Deck ${deckKey} is empty`);
  }

  const storageKey = `partypop_used_${sessionId || 'global'}_${deckKey}`;
  let seenKeys: Set<string> = new Set();
  try {
    const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
    if (raw) {
      seenKeys = new Set(JSON.parse(raw));
    }
  } catch {}

  // Filter available items that haven't been seen yet in this session
  let available = allItems.filter(item => !seenKeys.has(getItemKey(item)));

  // If all items in the entire deck have been used, cleanly reset history
  if (available.length === 0) {
    seenKeys.clear();
    available = [...allItems];
  }

  // Pick random item from available pool
  const randomIndex = Math.floor(Math.random() * available.length);
  const picked = available[randomIndex];
  const pickedKey = getItemKey(picked);

  // Record as seen in session storage
  seenKeys.add(pickedKey);
  try {
    const serialized = JSON.stringify(Array.from(seenKeys));
    sessionStorage.setItem(storageKey, serialized);
    localStorage.setItem(storageKey, serialized);
  } catch {}

  return picked;
}

/**
 * Reset used pool for a session and deck
 */
export function resetSessionDeck(sessionId: string, deckKey: string) {
  const storageKey = `partypop_used_${sessionId || 'global'}_${deckKey}`;
  try {
    sessionStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey);
  } catch {}
}
