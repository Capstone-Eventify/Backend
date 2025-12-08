# Backend API Summary

## Overview
Complete backend API implementation matching frontend requirements. All endpoints are now connected to PostgreSQL database via Prisma ORM.

## Database Connection
- **Database**: PostgreSQL (RDS Aurora)
- **Host**: `eventify-db.cvmwowsm8vv1.us-east-2.rds.amazonaws.com`
- **Port**: `5432`
- **Database Name**: `eventify`
- **SSL**: Enabled (`sslmode=require`)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /forgotpassword` - Request password reset
- `PUT /resetpassword/:token` - Reset password with token
- `GET /me` - Get current user (Protected)
- `PUT /updatedetails` - Update user details (Protected)
- `POST /logout` - Logout user (Protected)

### Events (`/api/events`)
- `GET /` - Get all events (with filtering, pagination, search)
- `GET /:id` - Get single event (formatted for frontend EventDetail type)
- `POST /` - Create event (Protected/Organizer)
- `PUT /:id` - Update event (Protected/Organizer)
- `DELETE /:id` - Delete event (Protected/Organizer)
- `GET /organizer/my-events` - Get organizer's events (Protected/Organizer)

### Payments (`/api/payments`)
- `POST /create-intent` - Create Stripe payment intent (Protected)
- `POST /confirm` - Confirm payment and create tickets (Protected)
- `POST /refund` - Process refund (Protected)
- `GET /history` - Get payment history (Protected)

### Tickets (`/api/tickets`)
- `GET /` - Get user's tickets (Protected)
- `GET /:id` - Get single ticket (Protected)
- `POST /:id/checkin` - Check in ticket via QR code (Protected/Organizer)
- `GET /event/:eventId` - Get tickets for event (Protected/Organizer)

### Users (`/api/users`)
- `GET /profile` - Get user profile (Protected)
- `PUT /profile` - Update user profile (Protected)
- `PUT /password` - Change password (Protected)
- `GET /tickets` - Get user's tickets (Protected)
- `GET /events` - Get user's events (Protected/Organizer)

### Support (`/api/support`)
- `POST /tickets` - Create support ticket (Protected)
- `GET /tickets` - Get user's support tickets (Protected)
- `GET /tickets/:id` - Get single support ticket (Protected)

### Social (`/api/social`)
- `GET /event/:eventId/share` - Get social sharing links for event
- `POST /track` - Track social share event

### Analytics (`/api/analytics`)
- `GET /event/:eventId` - Get event analytics (Protected/Organizer)
- `GET /organizer` - Get organizer dashboard analytics (Protected/Organizer)

### Notifications (`/api/notifications`)
- `POST /reminder` - Send event reminders (Protected/Organizer)

## Key Features

### Payment Processing
- ✅ Full Stripe integration with Payment Intents API
- ✅ Database-backed ticket creation
- ✅ Automatic event capacity tracking
- ✅ Refund processing with database updates
- ✅ Payment history tracking

### Event Management
- ✅ CRUD operations for events
- ✅ Organizer-specific event management
- ✅ Event capacity tracking
- ✅ View counting
- ✅ Formatted responses matching frontend types

### Ticket Management
- ✅ QR code generation for tickets
- ✅ Check-in functionality
- ✅ Ticket status tracking (PENDING, CONFIRMED, CANCELLED, REFUNDED)
- ✅ Order number generation

### User Management
- ✅ Profile management
- ✅ Password change functionality
- ✅ Role-based access control (ATTENDEE, ORGANIZER, ADMIN)

### Security
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based authorization
- ✅ Protected routes middleware

## Database Schema

### Models
- **User**: User accounts with roles and profile information
- **Event**: Event details with organizer relationship
- **Ticket**: Ticket records with QR codes and check-in status
- **Payment**: Payment records linked to Stripe

### Relationships
- User → Event (one-to-many: organizer)
- User → Ticket (one-to-many: attendee)
- User → Payment (one-to-many)
- Event → Ticket (one-to-many)
- Event → Payment (one-to-many)
- Ticket → Payment (one-to-one)

## Environment Variables

```env
NODE_ENV=development
PORT=5001
DATABASE_URL="postgresql://admin1:PASSWORD@eventify-db.cvmwowsm8vv1.us-east-2.rds.amazonaws.com:5432/eventify?schema=public&sslmode=require"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

## Running the Backend

```bash
cd Backend
npm install
npm run dev
```

Server runs on `http://localhost:5001`

## Testing

All endpoints are ready for frontend integration. The backend now:
- ✅ Uses real database instead of mock mode
- ✅ Properly handles Stripe payments with database persistence
- ✅ Matches frontend API expectations
- ✅ Includes proper error handling
- ✅ Implements authentication and authorization

## Next Steps

1. Test all endpoints with frontend
2. Add input validation middleware
3. Add rate limiting
4. Set up email service configuration
5. Configure push notification service
6. Add comprehensive error logging

