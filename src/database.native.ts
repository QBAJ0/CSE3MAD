import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

import type { AppSqliteDb } from "./database.types";

const DB_NAME = "stemm_lab.db";

let instance: SQLiteDatabase | null = null;

export function getDb(): AppSqliteDb {
  if (!instance) {
    instance = openDatabaseSync(DB_NAME);
  }
  return instance as unknown as AppSqliteDb;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      teamName TEXT NOT NULL,
      yearLevel TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      teamId INTEGER NOT NULL,
      memberName TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams (id) ON DELETE CASCADE
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS challenge_results (
      resultId TEXT PRIMARY KEY NOT NULL,
      sqliteTeamId INTEGER NOT NULL,
      teamDiscriminator TEXT NOT NULL,
      challengeId INTEGER NOT NULL,
      teamName TEXT NOT NULL,
      points INTEGER NOT NULL,
      payloadJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (sqliteTeamId) REFERENCES teams (id) ON DELETE CASCADE
    );
  `);
}
