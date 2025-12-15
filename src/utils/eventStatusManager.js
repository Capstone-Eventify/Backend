const prisma = require('../lib/prisma');

class EventStatusManager {
  /**
   * Get the computed status of an event based on current time and manual status
   * This provides a hybrid approach: manual control + automatic date-based logic
   */
  static getComputedStatus(event) {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Manual status takes precedence for DRAFT and CANCELLED
    if (event.status === 'DRAFT' || event.status === 'CANCELLED') {
      return event.status;
    }
    
    // For LIVE events, check if they should automatically become ENDED
    if (event.status === 'LIVE') {
      if (now > endDate) {
        return 'ENDED'; // Automatically end events that have passed
      }
      return 'LIVE';
    }
    
    // For other statuses, return as-is
    return event.status;
  }

  /**
   * Check if an event can be published (go live)
   */
  static canPublish(event) {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Can't publish if event has already ended
    if (now > endDate) {
      return {
        canPublish: false,
        reason: 'Cannot publish an event that has already ended'
      };
    }
    
    // Can publish if event is in the future or currently happening
    return {
      canPublish: true,
      reason: null
    };
  }

  /**
   * Get user-friendly status display
   */
  static getStatusDisplay(event) {
    const computedStatus = this.getComputedStatus(event);
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    switch (computedStatus) {
      case 'DRAFT':
        return {
          status: 'draft',
          label: 'Draft',
          description: 'Event is not yet published',
          color: 'yellow'
        };
        
      case 'LIVE':
        if (now < startDate) {
          return {
            status: 'upcoming',
            label: 'Live (Upcoming)',
            description: 'Registration open, event starts soon',
            color: 'blue'
          };
        } else if (now >= startDate && now <= endDate) {
          return {
            status: 'happening',
            label: 'Live (Happening Now)',
            description: 'Event is currently in progress',
            color: 'green'
          };
        } else {
          return {
            status: 'ended',
            label: 'Ended',
            description: 'Event has concluded',
            color: 'gray'
          };
        }
        
      case 'ENDED':
        return {
          status: 'ended',
          label: 'Ended',
          description: 'Event has concluded',
          color: 'gray'
        };
        
      case 'CANCELLED':
        return {
          status: 'cancelled',
          label: 'Cancelled',
          description: 'Event has been cancelled',
          color: 'red'
        };
        
      default:
        return {
          status: 'unknown',
          label: 'Unknown',
          description: 'Status unknown',
          color: 'gray'
        };
    }
  }

  /**
   * Auto-update event statuses (run this periodically)
   */
  static async updateExpiredEvents() {
    try {
      const now = new Date();
      
      // Find LIVE events that have ended
      const expiredEvents = await prisma.event.findMany({
        where: {
          status: 'LIVE',
          endDate: {
            lt: now
          }
        }
      });

      if (expiredEvents.length > 0) {
        // Update them to ENDED status
        await prisma.event.updateMany({
          where: {
            id: {
              in: expiredEvents.map(e => e.id)
            }
          },
          data: {
            status: 'ENDED'
          }
        });

        console.log(`Auto-updated ${expiredEvents.length} expired events to ENDED status`);
        return expiredEvents.length;
      }

      return 0;
    } catch (error) {
      console.error('Error updating expired events:', error);
      return 0;
    }
  }

  /**
   * Get events that will start soon (for notifications)
   */
  static async getEventsStartingSoon(hoursAhead = 24) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
      
      const upcomingEvents = await prisma.event.findMany({
        where: {
          status: 'LIVE',
          startDate: {
            gte: now,
            lte: futureTime
          }
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return upcomingEvents;
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }
}

module.exports = EventStatusManager;