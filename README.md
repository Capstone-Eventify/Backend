# Eventify Backend API

Backend API for Eventify - An event management platform built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- 🔐 Authentication & Authorization (JWT)
- 📅 Event Management (CRUD operations)
- 🎫 Ticket Management
- 💳 Payment Processing (Stripe integration ready)
- 📊 Analytics & Reporting
- 👤 User Management
- 🔍 Search & Filter
- 📸 Image Upload (Cloudinary ready)
- 🛡️ Security & Validation

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Stripe** - Payment processing
- **Cloudinary** - Image storage

## Project Structure

```
Backend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Custom middleware
│   ├── lib/                 # Prisma client
│   ├── models/              # (Legacy - can be removed)
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   └── server.js            # Application entry point
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/eventify?schema=public"
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create database schema
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `POST /api/auth/logout` - Logout user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Protected)
- `PUT /api/events/:id` - Update event (Protected)
- `DELETE /api/events/:id` - Delete event (Protected)
- `GET /api/events/organizer/my-events` - Get organizer's events

### Users
- `GET /api/users/profile` - Get user profile

### Payments
- `POST /api/payments` - Process payment (To be implemented)

### Tickets
- `GET /api/tickets` - Get tickets (To be implemented)

### Analytics
- `GET /api/analytics` - Get analytics (To be implemented)

## Database Models

### User
- Authentication & profile information
- Roles: ATTENDEE, ORGANIZER, ADMIN
- Profile fields, address, verification status

### Event
- Event details, dates, location
- Pricing & capacity
- Organizer relationship
- Status tracking

### Ticket
- Link to event & attendee
- Payment status
- QR code generation
- Check-in tracking

### Payment
- Transaction details
- Stripe integration
- Refund handling

## Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Validate Prisma schema
npx prisma validate
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Error handling
- Role-based access control

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Development

### Scripts

```bash
npm start                 # Start production server
npm run dev               # Start development server
npm test                 # Run tests
npm run lint             # Lint code
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. To modify the schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create a new migration
3. Run `npm run prisma:generate` to update the Prisma Client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit and push
5. Create a Pull Request

## Troubleshooting

### Prisma Client not generated
```bash
npm run prisma:generate
```

### Database connection issues
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database credentials

### Migration errors
```bash
npx prisma migrate reset  # (WARNING: deletes all data)
npx prisma migrate dev
```

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.
