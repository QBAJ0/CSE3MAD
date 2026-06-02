import { Platform } from "react-native";

import type { AppSqliteDb } from "./database.types";

type DatabaseModule = {
  getDb: () => AppSqliteDb;
  initDatabase: () => Promise<void>;
};

const databaseModule: DatabaseModule =
  Platform.OS === "web"
    ? (require("./database.web") as DatabaseModule)
    : (require("./database.native") as DatabaseModule);

export const getDb = databaseModule.getDb;
export const initDatabase = databaseModule.initDatabase;
