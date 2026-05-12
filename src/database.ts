/**
 * Metro picks `database.native.ts` / `database.web.ts` at bundle time.
 * This file satisfies TypeScript module resolution for `@/src/database`.
 */
export { getDb, initDatabase } from "./database.web";
