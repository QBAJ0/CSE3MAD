// TypeScript resolution shim; Metro resolves .native.ts / .web.ts at runtime.
export { getDb, initDatabase } from "./database.native";
