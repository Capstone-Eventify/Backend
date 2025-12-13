# Eventify Backend API

A comprehensive backend API for Eventify - A modern event management and ticketing platform built with Node.js, Express, Prisma, and PostgreSQL.

## 🚀 Features

### Core Functionality
- 🔐 **Complete Authentication System** - JWT-based auth with role management
- 📅 **Event Management** - Full CRUD operations with analytics
- 🎫 **Ticket System** - QR code generation, validation, and tier management
- 💳 **Payment Processing** - Stripe integration with refund support
- 📊 **Analytics & Reporting** - Real-time event and user analytics
- 👤 **User Management** - Profile management with role-based access
- 📧 **Communication System** - Email, SMS, and push notifications
- 🔔 **Real-time Notifications** - Socket.io integration
- 📸 **File Upload** - AWS S3 and Cloudinary integration
- 🎯 **Waitlist Management** - Event capacity and waitlist handling

### Advanced Features
- 🏢 **Organizer Applications** - Application and approval workflow
- ⭐ **Favorites System** - User event favorites
- 🎫 **Ticket Tiers** - Multiple pricing tiers per event
- 📱 **QR Code Generation** - PDF ticket generation with QR codes
- 🛡️ **Security & Validation** - Comprehensive input validation and security
- 📈 **Support System** - Ticket-based support system
- 🌐 **Social Features** - Event sharing and social interactions

## 🛠️ Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.io
- **Payments**: Stripe
- **File Storage**: AWS S3, Cloudinary
- **Email**: Nodemailer
- **SMS**: Twilio
- **PDF Generation**: PDFKit, jsPDF
- **QR Codes**: qrcode library
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
Backend/
├── prisma/
│   ├── migrations/          # Database migration files
│   └── schema.prisma        # Database schema definition
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # Database configuration
│   │   └── README.md
│   ├── controllers/         # Request handlers
│   │   ├── analyticsController.js      # Analytics endpoints
│   │   ├── authController.js           # Authentication
│   │   ├── eventController.js          # Event management
│   │   ├── favoritesController.js      # User favorites
│   │   ├── notificationController.js   # Notifications
│   │   ├── organizerApplicationController.js # Organizer applications
│   │   ├── paymentController.js        # Payment processing
│   │   ├── socialController.js         # Social features
│   │   ├── supportController.js        # Support system
│   │   ├── supportTicketController.js  # Support tickets
│   │   ├── ticketController.js         # Ticket management
│   │   ├── ticketTierController.js     # Ticket tiers
│   │   ├── uploadController.js         # File uploads
│   │   ├── userController.js           # User management
│   │   └── waitlistController.js       # Waitlist management
│   ├── lib/
│   │   └── prisma.js        # Prisma client instance
│   ├── middleware/          # Custom middleware
│   │   ├── asyncHandler.js  # Async error handling
│   │   ├── auth.js          # Authentication middleware
│   │   ├── errorHandler.js  # Global error handler
│   │   └── mockAuth.js      # Mock auth for testing
│   ├── models/              # Data models (legacy)
│   │   ├── Event.js
│   │   ├── Payment.js
│   │   ├── Ticket.js
│   │   └── User.js
│   ├── routes/              # API route definitions
│   │   ├── analytics.js     # Analytics routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── communications.js # Communication routes
│   │   ├── events.js        # Event routes
│   │   ├── favorites.js     # Favorites routes
│   │   ├── notifications.js # Notification routes
│   │   ├── organizerApplications.js # Organizer application routes
│   │   ├── payments.js      # Payment routes
│   │   ├── social.js        # Social routes
│   │   ├── support.js       # Support routes
│   │   ├── supportTickets.js # Support ticket routes
│   │   ├── tickets.js       # Ticket routes
│   │   ├── ticketTiers.js   # Ticket tier routes
│   │   ├── upload.js        # Upload routes
│   │   ├── user.js          # User routes
│   │   └── waitlist.js      # Waitlist routes
│   ├── services/            # Business logic services
│   │   ├── communicationService.js # Email/SMS service
│   │   ├── notificationService.js  # Notification service
│   │   └── socketService.js        # Socket.io service
│   ├── utils/               # Utility functions
│   │   ├── auth.js          # Auth utilities
│   │   ├── email.js         # Email utilities
│   │   ├── pdfGenerator.js  # PDF generation
│   │   ├── pushNotifications.js # Push notifications
│   │   ├── s3.js            # AWS S3 utilities
│   │   ├── sms.js           # SMS utilities
│   │   └── upload.js        # Upload utilities
│   └── server.js            # Application entry point
├── docs/                    # API documentation
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── Jenkinsfile              # CI/CD pipeline
├── create-admin-user.js     # Admin user creation script
├── create-test-users.js     # Test user creation script
└── README.md                # This file
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

## 🔗 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user profile
- `PUT /updatedetails` - Update user details
- `POST /logout` - Logout user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### Events (`/api/events`)
- `GET /` - Get all events (with filtering)
- `GET /:id` - Get single event details
- `POST /` - Create new event (Organizer+)
- `PUT /:id` - Update event (Organizer+)
- `DELETE /:id` - Delete event (Organizer+)
- `GET /organizer/my-events` - Get organizer's events
- `GET /:id/analytics` - Get event analytics
- `POST /:id/duplicate` - Duplicate event

### Tickets (`/api/tickets`)
- `GET /` - Get user's tickets
- `GET /:id` - Get single ticket
- `POST /` - Purchase tickets
- `PUT /:id` - Update ticket
- `DELETE /:id` - Cancel ticket
- `POST /:id/checkin` - Check-in ticket
- `GET /:id/qr` - Get QR code
- `POST /:id/download` - Download ticket PDF

### Ticket Tiers (`/api/ticket-tiers`)
- `GET /event/:eventId` - Get tiers for event
- `POST /` - Create ticket tier (Organizer+)
- `PUT /:id` - Update ticket tier (Organizer+)
- `DELETE /:id` - Delete ticket tier (Organizer+)

### Payments (`/api/payments`)
- `POST /create-intent` - Create payment intent
- `POST /confirm` - Confirm payment
- `POST /:id/refund` - Process refund
- `GET /` - Get payment history

### Users (`/api/user`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /avatar` - Upload avatar
- `GET /tickets` - Get user tickets
- `GET /events` - Get user events

### Favorites (`/api/favorites`)
- `GET /` - Get user favorites
- `POST /` - Add to favorites
- `DELETE /:eventId` - Remove from favorites

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `POST /` - Send notification (Admin)
- `PUT /:id/read` - Mark as read
- `DELETE /:id` - Delete notification

### Analytics (`/api/analytics`)
- `GET /dashboard` - Get dashboard analytics
- `GET /events/:id` - Get event analytics
- `GET /revenue` - Get revenue analytics
- `GET /users` - Get user analytics

### Organizer Applications (`/api/organizer-applications`)
- `POST /` - Submit organizer application
- `GET /my-application` - Get user's application
- `GET /` - Get all applications (Admin)
- `PUT /:id/approve` - Approve application (Admin)
- `PUT /:id/reject` - Reject application (Admin)

### Waitlist (`/api/waitlist`)
- `POST /` - Join waitlist
- `GET /event/:eventId` - Get event waitlist
- `DELETE /:id` - Leave waitlist
- `POST /:id/approve` - Approve waitlist entry

### Support (`/api/support`)
- `GET /tickets` - Get support tickets
- `POST /tickets` - Create support ticket
- `PUT /tickets/:id` - Update support ticket
- `GET /faq` - Get FAQ

### File Upload (`/api/upload`)
- `POST /image` - Upload image
- `POST /avatar` - Upload avatar
- `DELETE /:id` - Delete uploaded file

### Social (`/api/social`)
- `POST /share` - Share event
- `GET /trending` - Get trending events
- `POST /follow` - Follow organizer

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

## 🔧 Environment Variables

### Core Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | ✅ |
| `PORT` | Server port | `5001` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | JWT secret key | - | ✅ |
| `JWT_EXPIRE` | JWT expiration time | `7d` | ✅ |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` | ✅ |

### Payment Integration
| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |

### File Storage
| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ✅ |
| `AWS_REGION` | AWS region | ✅ |
| `AWS_S3_BUCKET` | S3 bucket name | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ⚪ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ⚪ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ⚪ |

### Communication Services
| Variable | Description | Required |
|----------|-------------|----------|
| `SENDGRID_API_KEY` | SendGrid API key | ✅ |
| `SENDGRID_FROM_EMAIL` | SendGrid sender email | ✅ |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | ✅ |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | ✅ |

### Gmail Configuration (Alternative)
| Variable | Description | Required |
|----------|-------------|----------|
| `GMAIL_USER` | Gmail username | ⚪ |
| `GMAIL_PASS` | Gmail app password | ⚪ |

### Additional Services
| Variable | Description | Required |
|----------|-------------|----------|
| `SOCKET_PORT` | Socket.io port | ⚪ |
| `REDIS_URL` | Redis connection string | ⚪ |
| `SENTRY_DSN` | Sentry error tracking | ⚪ |

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

### 📝 Available Scripts

```bash
# Server Management
npm start                    # Start production server
npm run dev                  # Start development server with auto-reload
npm run docs                 # Start API documentation server

# Database Management
npm run prisma:generate      # Generate Prisma Client
npm run prisma:migrate       # Run database migrations
npm run prisma:studio        # Open Prisma Studio (database GUI)

# Development Tools
npm test                     # Run test suite
npm run lint                 # Lint code with ESLint

# User Management
npm run create:admin         # Create admin user
npm run create:test-users    # Create test users for development
```

### 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Set up database
npm run prisma:generate
npm run prisma:migrate

# 4. Create admin user (optional)
npm run create:admin

# 5. Start development server
npm run dev
```

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. To modify the schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create a new migration
3. Run `npm run prisma:generate` to update the Prisma Client

## 🏗️ Architecture Overview

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (Admin, Organizer, Attendee)
- **Protected routes** with middleware validation
- **Password hashing** with bcryptjs

### Real-time Features
- **Socket.io integration** for live notifications
- **Real-time event updates** and messaging
- **Live analytics** and attendance tracking
- **Instant communication** between users

### Payment Processing
- **Stripe integration** for secure payments
- **Multiple payment methods** support
- **Refund handling** and transaction tracking
- **Webhook processing** for payment events

### File Management
- **AWS S3 integration** for scalable file storage
- **Cloudinary support** for image optimization
- **PDF generation** for tickets and reports
- **QR code generation** for ticket validation

### Communication System
- **Email notifications** via SendGrid/Gmail
- **SMS notifications** via Twilio
- **Push notifications** for mobile apps
- **In-app notifications** with real-time delivery

## 🔒 Security Features

- **JWT authentication** with secure token handling
- **Password hashing** with bcryptjs
- **Rate limiting** to prevent abuse
- **CORS protection** for cross-origin requests
- **Helmet security headers** for additional protection
- **Input validation** with express-validator
- **SQL injection prevention** with Prisma ORM
- **Error handling** without sensitive data exposure
- **Role-based access control** for API endpoints

## 📊 Database Schema

### Core Models
- **User** - Authentication, profile, and role management
- **Event** - Event details, dates, location, and settings
- **Ticket** - Ticket purchases, QR codes, and check-ins
- **TicketTier** - Multiple pricing tiers per event
- **Payment** - Transaction records and payment status

### Extended Models
- **Notification** - User notifications and alerts
- **Favorite** - User favorite events
- **Waitlist** - Event waitlist management
- **OrganizerApplication** - Organizer approval workflow
- **SupportTicket** - Customer support system

## 🚀 Deployment

### Production Environment
```bash
# Build and start
npm install --production
npm run prisma:generate
npm run prisma:migrate
npm start
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run prisma:generate
EXPOSE 5001
CMD ["npm", "start"]
```

### CI/CD Pipeline
- **Jenkins integration** with automated testing
- **Database migrations** on deployment
- **Environment-specific configurations**
- **Health checks** and monitoring

## 🧪 Testing

### Test Structure
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=events
npm test -- --testPathPattern=payments
```

### Test Coverage
- **Unit tests** for controllers and services
- **Integration tests** for API endpoints
- **Database tests** with test database
- **Authentication tests** for security

## 📈 Monitoring & Analytics

### Health Monitoring
- **Health check endpoint** (`/api/health`)
- **Database connection monitoring**
- **Service availability checks**
- **Performance metrics** tracking

### Analytics Features
- **Event analytics** - Views, registrations, revenue
- **User analytics** - Registration trends, activity
- **Revenue analytics** - Payment tracking, refunds
- **Real-time dashboards** for organizers and admins

## 🔧 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Fix migration issues
npx prisma migrate resolve --rolled-back "migration_name"
```

#### Authentication Issues
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Check token expiration
# Tokens expire based on JWT_EXPIRE setting
```

#### File Upload Issues
```bash
# Check AWS credentials
aws s3 ls s3://your-bucket-name

# Verify Cloudinary configuration
# Check CLOUDINARY_* environment variables
```

#### Payment Issues
```bash
# Test Stripe connection
# Use Stripe CLI for webhook testing
stripe listen --forward-to localhost:5001/api/payments/webhook
```

### Performance Optimization
- **Database indexing** for frequently queried fields
- **Connection pooling** with Prisma
- **Caching strategies** for static data
- **Rate limiting** for API protection
- **Compression middleware** for response optimization

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **ESLint** configuration for code quality
- **Prettier** for code formatting
- **Conventional commits** for commit messages
- **JSDoc** comments for function documentation

### Testing Requirements
- **Unit tests** for new features
- **Integration tests** for API endpoints
- **Database tests** for data operations
- **Security tests** for authentication

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

### Getting Help
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Comprehensive API documentation
- **Community** - Developer community support

### Additional Resources
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Socket.io Documentation](https://socket.io/docs/)

---

**Eventify Backend** - Built with ❤️ by the development team
