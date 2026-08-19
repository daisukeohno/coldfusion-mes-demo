import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';

export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: process.env.MES_DB_HOST ?? 'db',
      port: Number(process.env.MES_DB_PORT ?? 3306),
      user: process.env.MES_DB_USER ?? 'mesuser',
      password: process.env.MES_DB_PASSWORD ?? 'mespass',
      database: process.env.MES_DB_NAME ?? 'mesdb',
      timezone: process.env.MES_DB_TIMEZONE ?? '+09:00',
      charset: 'utf8mb4',
      decimalNumbers: false,
      dateStrings: true,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  async query<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.pool.execute<T[]>(sql, params);
    return rows;
  }

  async insert(sql: string, params: unknown[] = []): Promise<InsertResult> {
    const [result] = await this.pool.execute(sql, params);
    const header = result as { insertId: number; affectedRows: number };
    return { insertId: header.insertId, affectedRows: header.affectedRows };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
