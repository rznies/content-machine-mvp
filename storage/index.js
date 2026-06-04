import { DiskStorageAdapter } from "./adapters/disk.js";

// Instantiated singleton pointing to default db directory
export let storage = new DiskStorageAdapter("db");

export function setStorage(newStorage) {
  storage = newStorage;
}

