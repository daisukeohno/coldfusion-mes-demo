import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, Pool } from 'mysql2/promise';

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: process.env.MES_DB_HOST ?? '127.0.0.1',
      port: Number(process.env.MES_DB_PORT ?? 3306),
      user: process.env.MES_DB_USER ?? 'mesuser',
      password: process.env.MES_DB_PASSWORD ?? 'mespass',
      database: process.env.MES_DB_NAME ?? 'mesdb',
      charset: 'utf8mb4',
      timezone: '+09:00',
      dateStrings: true,
      decimalNumbers: false,
      connectionLimit: 5,
    });
  }

  get connection(): Pool {
    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
