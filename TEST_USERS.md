# Test Users Script

This script automatically creates test users for development and testing purposes.

## Quick Start

```bash
# Create all test users (Admin, Organizer, Attendees)
npm run create:test-users

# Or run directly
node create-test-users.js
```

## Test Users Created

### 1. Admin User
- **Email:** `admin@eventify.com`
- **Password:** `Admin@12345`
- **Role:** ADMIN
- **Features:** Full system access, can approve organizers, manage support tickets

### 2. Organizer User
- **Email:** `organizer@eventify.com`
- **Password:** `Organizer@12345`
- **Role:** ORGANIZER
- **Features:** Can create and manage events, view analytics, check-in attendees

### 3. Attendee User 1
- **Email:** `attendee1@eventify.com`
- **Password:** `Attendee@12345`
- **Role:** ATTENDEE
- **Features:** Can browse events, purchase tickets, view favorites

### 4. Attendee User 2
- **Email:** `attendee2@eventify.com`
- **Password:** `Attendee@12345`
- **Role:** ATTENDEE
- **Features:** Can browse events, purchase tickets, view favorites

## Features

- ✅ **Idempotent:** Run multiple times safely - updates existing users instead of failing
- ✅ **Pre-configured:** All users are verified, active, and have completed onboarding
- ✅ **Ready to use:** No manual setup required
- ✅ **Profile data:** Includes bio, location, and other profile fields

## Usage

### Development Workflow

1. **Reset database** (if needed):
   ```bash
   npx prisma migrate reset
   ```

2. **Create test users**:
   ```bash
   npm run create:test-users
   ```

3. **Start backend server**:
   ```bash
   npm run dev
   ```

4. **Login and test**:
   - Use any of the test user credentials above
   - Test different roles and permissions
   - No need to create accounts manually!

### Updating Users

If you need to update user passwords or details, simply:
1. Edit `create-test-users.js`
2. Run `npm run create:test-users` again
3. Existing users will be updated automatically

## Customization

Edit `create-test-users.js` to:
- Add more test users
- Change email addresses
- Modify passwords
- Update profile information
- Add more roles/types

## Related Scripts

- `npm run create:admin` - Creates only admin user (from create-admin-user.js)
- `npm run create:test-users` - Creates all test users (Admin, Organizer, Attendees)

## Notes

- All passwords follow the pattern: `{Role}@12345`
- All users are pre-verified and active
- All users have completed onboarding
- Safe to run multiple times - won't create duplicates

