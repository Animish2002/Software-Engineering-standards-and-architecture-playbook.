import { createApp } from './app.js';
import { config, configSummary } from './config.js';
import { logger } from './lib/logger.js';
import { pool } from '@app/db';

const app = createApp();
const server = app.listen(config.PORT, () => logger.info({ ...configSummary() }, 'listening'));
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 65_000;

let shuttingDown = false;
export const isShuttingDown = () => shuttingDown;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutdown: start');
  const deadline = setTimeout(() => { logger.error('shutdown: deadline exceeded'); process.exit(1); }, 15_000);
  deadline.unref();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  server.closeIdleConnections();
  await pool.end();
  logger.info('shutdown: complete');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (err) => { logger.fatal({ err }, 'unhandledRejection'); process.exit(1); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'uncaughtException'); process.exit(1); });
