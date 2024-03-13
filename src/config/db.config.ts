export interface DatabaseConfig {
  user: string;
  password: string;
  server: string;
  database: string;
}

export const databaseConfig: DatabaseConfig = {
  user: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
  server: process.env.DB_HOST || "",
  database: process.env.DB_NAME || "",
};
