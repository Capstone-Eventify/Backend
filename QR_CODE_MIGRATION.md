# QR Code Migration Guide

## Changes Made

### 1. Database Schema Updates
- Added `@unique` constraint on `qrCode` field in Ticket model
- Added database index on `qrCode` for faster lookups
- QR codes now store the ticket ID directly (instead of custom format)

### 2. QR Code Generation
- **Before:** `QR-${eventId}-${userId}-${Date.now()}-${i}`
- **After:** Uses `ticket.id` directly as the QR code

### 3. New API Endpoint
- **Route:** `GET /api/tickets/qr/:qrCode`
- **Access:** Organizer/Admin only
- **Purpose:** Direct lookup of tickets by QR code

### 4. Check-In Process
- QR code scanner now uses dedicated endpoint
- Simplified lookup logic (QR code = ticket ID)

## Migration Steps

### Step 1: Run Database Migration
```bash
cd Backend
npx prisma migrate dev --name update_qr_code_to_ticket_id
```

### Step 2: Migrate Existing Tickets (if any)
If you have existing tickets with old QR code format, run this migration script:

```javascript
// migrate-qr-codes.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateQRCodes() {
  const tickets = await prisma.ticket.findMany({
    where: {
      qrCode: {
        not: null
      }
    }
  });

  console.log(`Found ${tickets.length} tickets to migrate`);

  for (const ticket of tickets) {
    // Only update if QR code doesn't match ticket ID
    if (ticket.qrCode !== ticket.id) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrCode: ticket.id }
      });
      console.log(`Updated ticket ${ticket.id}`);
    }
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

migrateQRCodes().catch(console.error);
```

Run with:
```bash
node migrate-qr-codes.js
```

### Step 3: Verify Migration
```bash
# Check for any tickets with null QR codes
npx prisma studio
# Or query directly:
# SELECT id, qrCode FROM "Ticket" WHERE qrCode IS NULL;
```

## Benefits

1. **Faster Lookups:** Direct ticket ID lookup instead of searching
2. **Simpler Logic:** QR code = ticket ID, no parsing needed
3. **Better Performance:** Unique constraint and index on qrCode
4. **Easier Debugging:** QR code value is human-readable (UUID)

## Breaking Changes

- Old QR codes (format: `QR-xxx-yyy-timestamp-index`) will no longer work
- All existing tickets need QR codes updated to their ticket IDs
- Frontend QR scanner updated to use new endpoint

## Testing

1. Create a new ticket (should get QR code = ticket ID)
2. Scan QR code using QRCodeScanner component
3. Verify check-in works correctly
4. Test with multiple tickets for same event

