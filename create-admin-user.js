/**
 * Script to create an admin user
 * Run: node create-admin-user.js
 */

require('dotenv').config();
const prisma = require('./src/lib/prisma');
const { hashPassword } = require('./src/utils/auth');

async function createAdminUser() {
  try {
    const email = 'thilakediga321@gmail.com';
    const password = 'Thilak@12345';
    const firstName = 'Thilak';
    const lastName = 'Narasimhamurthy';

    console.log('🔐 Creating admin user...');
    console.log(`Email: ${email}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  User already exists. Updating to admin role...');
      
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          password: await hashPassword(password), // Update password
          firstName,
          lastName,
          isActive: true,
          isVerified: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true
        }
      });

      console.log('✅ User updated to admin successfully!');
      console.log('User details:', updatedUser);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
        hasCompletedOnboarding: true // Admin doesn't need onboarding
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

    console.log('✅ Admin user created successfully!');
    console.log('User details:', adminUser);
    console.log('\n📝 Login credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

