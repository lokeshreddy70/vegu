import app from './app';
import { config } from './config';
import { prisma } from './prisma/client';
import { logger } from './utils/logger';

const start = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(config.port, () => {
      logger.info(`VEGU API running on port ${config.port}`, { env: config.nodeEnv });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start();
