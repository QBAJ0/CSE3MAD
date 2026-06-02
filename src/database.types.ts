/** Subset of `expo-sqlite` `SQLiteDatabase` used by `teamDb` / `challengeResultDb`. */
export interface AppSqliteDb {
  execAsync(source: string): Promise<void>;
  runAsync(
    source: string,
    ...params: unknown[]
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(
    source: string,
    ...params: unknown[]
  ): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
}
