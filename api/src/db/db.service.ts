import { Injectable, OnModuleDestroy } from '@nestjs/common';
import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MES_DB_HOST ?? 'db',
      port: Number(process.env.MES_DB_PORT ?? 3306),
      user: process.env.MES_DB_USER ?? 'mesuser',
      password: process.env.MES_DB_PASSWORD ?? 'mespass',
      database: process.env.MES_DB_NAME ?? 'mesdb',
      charset: 'utf8mb4',
      timezone: '+09:00',
      dateStrings: true,
      // DECIMAL(8,3) は丸め誤差を避けるため文字列で受け取る
      decimalNumbers: false,
      connectionLimit: 5,
    });
  }

  async query<T extends RowDataPacket>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    const [rows] = await this.pool.execute<T[]>(sql, params);
    return rows;
  }

  async execute(sql: string, params: (string | number | null)[] = []): Promise<ResultSetHeader> {
    const [result] = await this.pool.execute<ResultSetHeader>(sql, params);
    return result;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
