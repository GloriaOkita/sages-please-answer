import { useEffect, useState } from "react";
import { migratePersistedPosts } from "../data/legacyCharacterIds.js";

export const STORAGE_KEY = "ancient-moments-state-v2";
export const LEGACY_STORAGE_KEY = "ancient-moments-state-v1";

export function usePersistedMoments() {
  const [posts, setPosts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      return stored ? migratePersistedPosts(JSON.parse(stored).posts ?? []) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ posts }));
  }, [posts]);

  return [posts, setPosts];
}
