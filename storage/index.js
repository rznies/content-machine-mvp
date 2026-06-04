import { DiskStorageAdapter } from "./adapters/disk.js";

// Instantiated singleton pointing to default db directory
export const storage = new DiskStorageAdapter("db");
