const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle Prisma Client connection
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma Client connected to PostgreSQL');
  })
  .catch((err) => {
    console.error('❌ Prisma Client connection error:', err);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

