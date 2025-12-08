const { PrismaClient } = require('@prisma/client');

// Create Prisma client but don't crash if database is unavailable
let prisma;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Try to connect, but don't block if it fails (for mock mode)
  prisma.$connect()
    .then(() => {
      console.log('✅ Prisma Client connected to PostgreSQL');
    })
    .catch((err) => {
      console.warn('⚠️  Database not available - Running in MOCK MODE');
      console.warn('   Stripe payments will work, but data won\'t be persisted');
    });
} catch (error) {
  console.warn('⚠️  Prisma initialization failed - Running in MOCK MODE');
  // Create a mock prisma object that won't crash
  prisma = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  };
}

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    if (prisma && prisma.$disconnect) {
      await prisma.$disconnect();
    }
  } catch (error) {
    // Ignore disconnect errors in mock mode
  }
});

module.exports = prisma;

