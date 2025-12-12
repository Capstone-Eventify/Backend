const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          process.env.CORS_ORIGIN || 'http://localhost:3000',
          'http://localhost:3000',
          'http://127.0.0.1:3000'
        ],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, role: true, firstName: true, lastName: true }
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.firstName} ${socket.user.lastName} connected (${socket.userId})`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Join user to role-based rooms
      socket.join(`role_${socket.user.role.toLowerCase()}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.firstName} ${socket.user.lastName} disconnected (${socket.userId})`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle notification acknowledgment
      socket.on('notification_read', async (notificationId) => {
        try {
          await prisma.notification.update({
            where: { 
              id: notificationId,
              userId: socket.userId 
            },
            data: {
              isRead: true,
              readAt: new Date()
            }
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });
    });

    console.log('✅ Socket.IO service initialized');
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    if (!this.io) return;

    try {
      // Send real-time notification
      this.io.to(`user_${userId}`).emit('notification', notification);
      
      // Store in database
      await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link
        }
      });

      console.log(`Notification sent to user ${userId}:`, notification.title);
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification) {
    if (!this.io) return;

    const promises = userIds.map(userId => this.sendToUser(userId, notification));
    await Promise.all(promises);
  }

  // Send notification to all users with specific role
  async sendToRole(role, notification) {
    if (!this.io) return;

    try {
      // Send real-time notification to role room
      this.io.to(`role_${role.toLowerCase()}`).emit('notification', notification);
      
      // Get all users with this role and store notifications
      const users = await prisma.user.findMany({
        where: { role: role.toUpperCase() },
        select: { id: true }
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link
      }));

      await prisma.notification.createMany({
        data: notifications
      });

      console.log(`Notification sent to ${users.length} users with role ${role}:`, notification.title);
    } catch (error) {
      console.error('Error sending notification to role:', error);
    }
  }

  // Send notification to all connected users
  async sendToAll(notification) {
    if (!this.io) return;

    try {
      // Send real-time notification to all connected users
      this.io.emit('notification', notification);
      
      // Get all users and store notifications
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link
      }));

      await prisma.notification.createMany({
        data: notifications
      });

      console.log(`Notification sent to all users:`, notification.title);
    } catch (error) {
      console.error('Error sending notification to all users:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Export singleton instance
module.exports = new SocketService();