/**
 * Migration script to update existing tickets' QR codes to use ticket ID
 * Run this after updating the Prisma schema
 * 
 * Usage: node migrate-qr-codes.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateQRCodes() {
  try {
    console.log('Starting QR code migration...');
    
    // Find all tickets
    const tickets = await prisma.ticket.findMany();

    console.log(`Found ${tickets.length} tickets to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const ticket of tickets) {
      // Check if QR code already matches ticket ID (skip if already correct)
      if (ticket.qrCode === ticket.id) {
        skipped++;
        continue;
      }
      
      // Skip if QR code is null (will be set to ticket.id)
      // This handles both null QR codes and old format QR codes

      try {
        // Update QR code to ticket ID
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { qrCode: ticket.id }
        });
        updated++;
        console.log(`✓ Updated ticket ${ticket.id}`);
      } catch (error) {
        // Handle unique constraint violation (shouldn't happen, but just in case)
        if (error.code === 'P2002') {
          console.error(`✗ Failed to update ticket ${ticket.id}: QR code already exists`);
        } else {
          console.error(`✗ Failed to update ticket ${ticket.id}:`, error.message);
        }
      }
    }

    console.log('\nMigration Summary:');
    console.log(`- Updated: ${updated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Total: ${tickets.length}`);
    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateQRCodes();

