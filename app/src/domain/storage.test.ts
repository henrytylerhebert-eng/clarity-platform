import { describe, expect, it } from "vitest";
import { loadAppState, saveAppState } from "./storage";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

describe("storage", () => {
  it("loads seed data and persists changes", async () => {
    const storage = new MemoryStorage();
    const seed = await loadAppState(storage);
    expect(seed.cases.length).toBeGreaterThan(0);
    const changed = { ...seed, cases: [{ ...seed.cases[0], assignedOwner: "Changed Owner" }, ...seed.cases.slice(1)] };
    saveAppState(changed, storage);
    const reloaded = await loadAppState(storage);
    expect(reloaded.cases[0].assignedOwner).toBe("Changed Owner");
  });
});

