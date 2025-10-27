# Prisma Setup Guide

This guide will help you set up Prisma with PostgreSQL for the Eventify backend.

## Prerequisites

1. PostgreSQL installed and running
2. Node.js (v16 or higher)
3. npm or yarn

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This installs both `@prisma/client` and `prisma` (dev dependency).

### 2. Configure Database Connection

Edit the `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/eventify?schema=public"
```

Replace `username`, `password`, and `eventify` with your PostgreSQL credentials and database name.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This creates the Prisma Client based on your schema.

### 4. Run Initial Migration

```bash
npm run prisma:migrate
```

This will:
- Create the database if it doesn't exist
- Create all tables based on the schema
- Apply the migration

When prompted, give the migration a name like: `init`

### 5. Start the Server

```bash
npm run dev
```

## Working with Prisma

### Generate Prisma Client After Schema Changes

```bash
npm run prisma:generate
```

### Create a Migration

After modifying `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

Enter a descriptive name for your migration.

### View/Edit Data in Database

```bash
npm run prisma:studio
```

This opens Prisma Studio, a visual database browser at `http://localhost:5555`

### Reset Database (WARNING: Deletes All Data)

```bash
npx prisma migrate reset
```

This drops the database, recreates it, and applies all migrations.

## Common Tasks

### Adding a New Model

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Run `npm run prisma:generate`
4. Use in your code: `prisma.newModel.create(...)`

### Modifying an Existing Model

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Run `npm run prisma:generate`
4. Update your code as needed

### Seeding the Database

Create a `prisma/seed.js` file:

```javascript
const prisma = require('./src/lib/prisma');

async function main() {
  // Create sample data
  const user = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      role: 'ORGANIZER'
    }
  });
  
  console.log('Created user:', user);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run the seed:

```bash
npx prisma db seed
```

## Prisma Schema Overview

The current schema includes:

- **User** - User accounts with roles (ATTENDEE, ORGANIZER, ADMIN)
- **Event** - Events with details, dates, pricing
- **Ticket** - Ticket bookings
- **Payment** - Payment transactions

## Best Practices

1. **Always run migrations before generating**:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

2. **Use Prisma Studio for testing**: Visual interface to view/edit data

3. **Don't edit migrations manually**: Let Prisma manage them

4. **Use transactions for complex operations**:
   ```javascript
   await prisma.$transaction([
     prisma.event.create({ ... }),
     prisma.ticket.create({ ... })
   ]);
   ```

5. **Disconnect Prisma Client**: Not needed in the app, but useful in scripts:
   ```javascript
   await prisma.$disconnect();
   ```

## Troubleshooting

### "Can't reach database server"

- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Check firewall settings

### "Migration failed"

- Check database connection
- Look at error message
- Try resetting: `npx prisma migrate reset`

### "Prisma Client not generated"

```bash
npm run prisma:generate
```

### Schema syntax errors

```bash
npx prisma validate
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Prisma API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

