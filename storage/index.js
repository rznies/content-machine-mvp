import { DiskStorageAdapter } from "./adapters/disk.js";
import { InMemoryStorageAdapter } from "./adapters/memory.js";

// Instantiated singleton pointing to default db directory, or memory adapter on Vercel
export let storage = process.env.VERCEL
  ? new InMemoryStorageAdapter()
  : new DiskStorageAdapter("db");

export function setStorage(newStorage) {
  storage = newStorage;
}

