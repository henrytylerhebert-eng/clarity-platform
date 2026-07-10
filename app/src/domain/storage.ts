import type { AppState } from "./types";
import { createSeedState } from "./seed";

const STORAGE_KEY = "clarity-intake-spine-v0.2";

function isCurrentShape(state: Partial<AppState>): boolean {
  return Array.isArray(state.complianceClocks)
    && Array.isArray(state.units)
    && Array.isArray(state.beds)
    && Array.isArray(state.placementRecommendations);
}

class FallbackStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

const fallbackStorage = new FallbackStorage();

function defaultStorage(): Storage {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return fallbackStorage;
  }
  return fallbackStorage;
}

export async function loadAppState(storage: Storage = defaultStorage()): Promise<AppState> {
  const stored = storage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as AppState;
    if (isCurrentShape(parsed)) {
      return parsed;
    }
  }
  const seed = await createSeedState();
  storage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveAppState(state: AppState, storage: Storage = defaultStorage()): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function resetAppState(storage: Storage = defaultStorage()): Promise<AppState> {
  const seed = await createSeedState();
  storage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}
