import { createApp } from './app';
import { createDatabasePool } from './config/database';
import { MysqlInspectionRepository } from './repositories/mysqlInspectionRepository';

const port = Number(process.env.PORT ?? 3000);
const pool = createDatabasePool();
const repository = new MysqlInspectionRepository(pool);
const app = createApp(repository);

const server = app.listen(port, () => {
  console.log(`Inspection API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
