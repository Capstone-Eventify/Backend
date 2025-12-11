/**
 * Script to create test users (Attendee, Organizer, Admin)
 * Run: node create-test-users.js
 * 
 * This script creates:
 * - 1 Admin user
 * - 1 Organizer user
 * - 2 Attendee users
 * 
 * All users are pre-configured and ready to use for testing.
 */

require('dotenv').config();
const prisma = require('./src/lib/prisma');
const { hashPassword } = require('./src/utils/auth');

const testUsers = [
  // Admin User
  {
    email: 'admin@eventify.com',
    password: 'Admin@12345',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isVerified: true,
    isActive: true,
    hasCompletedOnboarding: true,
    bio: 'System Administrator'
  },
  // Organizer User
  {
    email: 'organizer@eventify.com',
    password: 'Organizer@12345',
    firstName: 'John',
    lastName: 'Organizer',
    role: 'ORGANIZER',
    isVerified: true,
    isActive: true,
    hasCompletedOnboarding: true,
    bio: 'Professional Event Organizer',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA'
  },
  // Attendee User 1
  {
    email: 'attendee1@eventify.com',
    password: 'Attendee@12345',
    firstName: 'Alice',
    lastName: 'Attendee',
    role: 'ATTENDEE',
    isVerified: true,
    isActive: true,
    hasCompletedOnboarding: true,
    bio: 'Event Enthusiast',
    city: 'New York',
    state: 'NY',
    country: 'USA'
  },
  // Attendee User 2
  {
    email: 'attendee2@eventify.com',
    password: 'Attendee@12345',
    firstName: 'Bob',
    lastName: 'Smith',
    role: 'ATTENDEE',
    isVerified: true,
    isActive: true,
    hasCompletedOnboarding: true,
    bio: 'Tech Conference Lover',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA'
  }
];

async function createTestUsers() {
  try {
    console.log('🚀 Creating test users...\n');

    const createdUsers = [];
    const updatedUsers = [];

    for (const userData of testUsers) {
      const { email, password, ...userFields } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        console.log(`⚠️  User ${email} already exists. Updating...`);
        
        // Update existing user
        const hashedPassword = await hashPassword(password);
        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            ...userFields,
            password: hashedPassword
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            hasCompletedOnboarding: true
          }
        });

        updatedUsers.push({ ...updatedUser, password });
        console.log(`✅ Updated user: ${email} (${userFields.role})`);
      } else {
        // Create new user
        const hashedPassword = await hashPassword(password);
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            ...userFields
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isVerified: true,
            hasCompletedOnboarding: true
          }
        });

        createdUsers.push({ ...newUser, password });
        console.log(`✅ Created user: ${email} (${userFields.role})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST USERS SUMMARY');
    console.log('='.repeat(60) + '\n');

    if (createdUsers.length > 0) {
      console.log('✨ Newly Created Users:');
      createdUsers.forEach(user => {
        console.log(`   • ${user.email} (${user.role})`);
      });
      console.log('');
    }

    if (updatedUsers.length > 0) {
      console.log('🔄 Updated Users:');
      updatedUsers.forEach(user => {
        console.log(`   • ${user.email} (${user.role})`);
      });
      console.log('');
    }

    console.log('📝 Login Credentials:\n');
    testUsers.forEach(user => {
      console.log(`   ${user.role}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('✅ Test users setup complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();



