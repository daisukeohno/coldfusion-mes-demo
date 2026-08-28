import mysql from 'mysql2/promise';

export function createDatabasePool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.MES_DB_HOST ?? 'db',
    port: Number(process.env.MES_DB_PORT ?? 3306),
    database: process.env.MES_DB_NAME ?? 'mesdb',
    user: process.env.MES_DB_USER ?? 'mesuser',
    password: process.env.MES_DB_PASSWORD ?? 'mespass',
    connectionLimit: Number(process.env.MES_DB_CONNECTION_LIMIT ?? 10),
    dateStrings: true,
    decimalNumbers: false,
    charset: 'utf8mb4',
  });
}
