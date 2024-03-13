import { databaseConfig } from "../config/db.config";
import { Pool } from "pg";
import { loggerUtil } from "./logger.util";

const pool = new Pool({
  user: databaseConfig.user,
  host: databaseConfig.server,
  database: databaseConfig.database,
  password: databaseConfig.password,
  port: 5432,
});

pool.on("error", (err, client) => {
  loggerUtil.error(`SQL Error : ${err}`);
});

pool.on("connect", (err) => {
  loggerUtil.info("SQL Pool Connected");
});

pool.on("release", (err) => {
  loggerUtil.info("SQL Pool Released");
});

export default pool;
