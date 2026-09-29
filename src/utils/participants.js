export function selectParticipants(characters, mentionedIds = [], random = Math.random) {
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const uniqueMentionedIds = [...new Set(mentionedIds)].filter((id) => characterById.has(id));
  const mentioned = uniqueMentionedIds.map((id) => characterById.get(id)).slice(0, 5);
  const target = Math.min(characters.length, 6 + Math.floor(random() * 3));
  const mentionedSet = new Set(mentioned.map(({ id }) => id));
  const remaining = characters.filter(({ id }) => !mentionedSet.has(id));

  // Partial Fisher-Yates keeps selection uniform and lets tests inject deterministic randomness.
  for (let index = remaining.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
  }

  return [...mentioned, ...remaining.slice(0, Math.max(0, target - mentioned.length))];
}
