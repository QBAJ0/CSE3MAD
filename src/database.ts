import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "stemm_lab.db";

let instance: SQLiteDatabase | null = null;

export function getDb(): SQLiteDatabase {
  if (!instance) {
    instance = openDatabaseSync(DB_NAME);
  }
  return instance;
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
}
