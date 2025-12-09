# API Alignment Summary

This document summarizes all the changes made to align the backend API and database schema with the frontend requirements.

## Database Schema Changes

### 1. Event Model Updates
- ✅ Added `fullDescription` field (Text) for detailed event descriptions
- ✅ Added `hasSeating` field (Boolean) to indicate if event has assigned seating
- ✅ Added relations to `TicketTier[]` and `WaitlistEntry[]`

### 2. New Models Added

#### TicketTier Model
- `id` (UUID, Primary Key)
- `eventId` (Foreign Key to Event)
- `name` (String) - e.g., "Early Bird", "General Admission", "VIP"
- `price` (Float)
- `description` (Text, Optional)
- `quantity` (Int) - Total quantity available
- `available` (Int) - Remaining quantity available
- `isActive` (Boolean) - Soft delete flag
- Relations: `event`, `tickets[]`, `waitlistEntries[]`

#### WaitlistEntry Model
- `id` (UUID, Primary Key)
- `eventId` (Foreign Key to Event)
- `userId` (Foreign Key to User)
- `ticketTierId` (Foreign Key to TicketTier)
- `quantity` (Int, Default: 1)
- `status` (String, Default: "pending") - pending, approved, rejected
- `notes` (Text, Optional)
- `requestedAt` (DateTime)
- Unique constraint on `[eventId, userId, ticketTierId]`

### 3. Ticket Model Updates
- ✅ Added `ticketTierId` (Foreign Key to TicketTier, Optional)
- ✅ Added relation to `TicketTier`

### 4. User Model Updates
- ✅ Added relation to `WaitlistEntry[]`

## API Endpoint Updates

### Event Endpoints (`/api/events`)

#### GET `/api/events`
- ✅ Updated to include ticket tiers and formatted response
- ✅ Returns events with `organizer.name` (firstName + lastName)
- ✅ Returns formatted `date`, `time`, `endDate`, `endTime` as strings
- ✅ Returns `price` as formatted string (e.g., "$25.00" or "FREE")
- ✅ Returns `status` mapped to frontend format (upcoming, live, ended, cancelled)
- ✅ Returns `location` formatted based on online/in-person status

#### GET `/api/events/:id`
- ✅ Updated to include ticket tiers
- ✅ Returns `fullDescription` field
- ✅ Returns formatted `ticketTiers` array
- ✅ Returns `organizer` object with `name` field
- ✅ Returns all fields matching `EventDetail` type

#### POST `/api/events`
- ✅ Updated to handle `ticketTiers` array
- ✅ Converts `date`/`time` strings to DateTime objects
- ✅ Creates ticket tiers in transaction
- ✅ Returns formatted response matching frontend expectations

#### PUT `/api/events/:id`
- ✅ Updated to handle ticket tier updates
- ✅ Supports updating ticket tiers array
- ✅ Converts date/time strings to DateTime objects
- ✅ Returns formatted response

#### GET `/api/events/organizer/my-events`
- ✅ Updated to include ticket tiers
- ✅ Returns formatted events matching frontend expectations

### Ticket Tier Endpoints (`/api/ticket-tiers`)

#### GET `/api/ticket-tiers/events/:eventId/ticket-tiers`
- ✅ Public endpoint to get all active ticket tiers for an event

#### POST `/api/ticket-tiers/events/:eventId/ticket-tiers`
- ✅ Protected (Organizer/Admin only)
- ✅ Creates new ticket tier for an event

#### PUT `/api/ticket-tiers/:tierId`
- ✅ Protected (Organizer/Admin only)
- ✅ Updates ticket tier

#### DELETE `/api/ticket-tiers/:tierId`
- ✅ Protected (Organizer/Admin only)
- ✅ Soft deletes ticket tier (sets isActive to false)

### Waitlist Endpoints (`/api/waitlist`)

#### POST `/api/waitlist/events/:eventId/waitlist`
- ✅ Protected (User)
- ✅ Adds user to waitlist for a ticket tier
- ✅ Returns formatted waitlist entry matching `WaitlistEntry` type

#### GET `/api/waitlist/events/:eventId/waitlist`
- ✅ Protected (Organizer/Admin only)
- ✅ Gets all waitlist entries for an event
- ✅ Returns formatted entries with user and tier information

#### GET `/api/waitlist`
- ✅ Protected (User)
- ✅ Gets current user's waitlist entries
- ✅ Returns formatted entries

#### PUT `/api/waitlist/:entryId`
- ✅ Protected (Organizer/Admin only)
- ✅ Updates waitlist entry status (approve/reject)
- ✅ Returns formatted entry

#### DELETE `/api/waitlist/:entryId`
- ✅ Protected (User)
- ✅ Removes user from waitlist

### Payment Endpoints (`/api/payments`)

#### POST `/api/payments/create-intent`
- ✅ Updated to work with ticket tiers
- ✅ Calculates amount from ticket tier price if `ticketTierId` provided
- ✅ Validates ticket tier availability
- ✅ Returns payment intent with client secret

#### POST `/api/payments/confirm`
- ✅ Updated to link tickets to ticket tiers
- ✅ Updates ticket tier `available` count when tickets are purchased
- ✅ Creates tickets with `ticketTierId` reference

### User Endpoints (`/api/users`)

#### GET `/api/users/profile`
- ✅ Returns `name` field (firstName + lastName)
- ✅ Returns formatted user object

### Auth Endpoints (`/api/auth`)

#### POST `/api/auth/register`
- ✅ Returns user with `name` field
- ✅ Returns role in lowercase format

#### POST `/api/auth/login`
- ✅ Returns user with `name` field
- ✅ Returns role in lowercase format

#### GET `/api/auth/me`
- ✅ Returns user with `name` field
- ✅ Returns role in lowercase format
- ✅ Returns `joinDate` field (from createdAt)

### Ticket Endpoints (`/api/tickets`)

#### GET `/api/tickets`
- ✅ Updated to include `ticketTier` information
- ✅ Returns tickets with tier details

#### GET `/api/tickets/:id`
- ✅ Updated to include `ticketTier` information
- ✅ Returns ticket with tier details

## Response Format Changes

### Event Response Format
All event endpoints now return data matching the frontend `EventDetail` type:
```typescript
{
  id: string
  title: string
  description: string
  fullDescription: string
  date: string // YYYY-MM-DD format
  time: string // HH:mm format
  endDate?: string
  endTime?: string
  location: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isOnline: boolean
  meetingLink?: string
  category: string
  image: string
  images?: string[]
  price: string // "$25.00" or "FREE"
  ticketTiers: TicketTier[]
  maxAttendees: number
  attendees: number
  status: 'upcoming' | 'live' | 'ended' | 'cancelled'
  tags?: string[]
  requirements?: string
  refundPolicy?: string
  hasSeating: boolean
  organizer: {
    id: string
    name: string // firstName + lastName
    email: string
    avatar?: string
    bio?: string
  }
  createdAt: string
}
```

### User Response Format
All user endpoints now return:
```typescript
{
  id: string
  firstName: string
  lastName: string
  name: string // firstName + lastName
  email: string
  role: string // lowercase: 'attendee' | 'organizer' | 'admin'
  // ... other fields
  joinDate?: string // ISO date string
}
```

### TicketTier Format
```typescript
{
  id: string
  name: string
  price: number
  description?: string
  quantity: number
  available: number
}
```

### WaitlistEntry Format
```typescript
{
  id: string
  eventId: string
  userId: string
  userName: string // firstName + lastName
  userEmail: string
  ticketTierId: string
  ticketTierName: string
  quantity: number
  requestedAt: string // ISO date string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}
```

## Status Mapping

### Event Status
- Database: `DRAFT`, `PUBLISHED`, `LIVE`, `ENDED`, `CANCELLED`
- Frontend: `upcoming`, `live`, `ended`, `cancelled`
- Mapping:
  - `DRAFT` → `upcoming`
  - `PUBLISHED` → `upcoming`
  - `LIVE` → `live`
  - `ENDED` → `ended`
  - `CANCELLED` → `cancelled`

### User Role
- Database: `ATTENDEE`, `ORGANIZER`, `ADMIN`
- Frontend: `attendee`, `organizer`, `admin`
- All role responses are converted to lowercase

## Database Migration

✅ Schema changes have been applied using `prisma db push`
✅ Prisma Client has been regenerated
✅ All relations are properly configured

## Testing Checklist

- [ ] Test event creation with ticket tiers
- [ ] Test event update with ticket tiers
- [ ] Test payment flow with ticket tiers
- [ ] Test waitlist join/approve/reject flow
- [ ] Test event listing with formatted responses
- [ ] Test user profile endpoints return `name` field
- [ ] Test auth endpoints return formatted user data
- [ ] Verify all date/time fields are formatted correctly
- [ ] Verify price fields are formatted as strings
- [ ] Verify status fields are mapped correctly

## Notes

- All date/time fields are converted from DateTime to ISO string format for frontend
- Price fields are formatted as strings (e.g., "$25.00" or "FREE")
- Organizer name is always returned as `firstName + lastName` in `name` field
- Ticket tiers are always sorted by price (ascending)
- Ticket tier availability is automatically decremented when tickets are purchased
- Waitlist entries have unique constraint per user per tier per event

