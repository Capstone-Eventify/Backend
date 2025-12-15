const EventStatusManager = require('../utils/eventStatusManager');

class EventStatusJob {
  /**
   * Run the event status update job
   * This should be called periodically (e.g., every hour)
   */
  static async run() {
    try {
      console.log('🔄 Running event status update job...');
      
      const updatedCount = await EventStatusManager.updateExpiredEvents();
      
      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} expired events to ENDED status`);
      } else {
        console.log('✅ No expired events to update');
      }
      
      return updatedCount;
    } catch (error) {
      console.error('❌ Error running event status job:', error);
      return 0;
    }
  }

  /**
   * Start the periodic job (run every hour)
   */
  static start() {
    console.log('🚀 Starting event status job scheduler...');
    
    // Run immediately
    this.run();
    
    // Then run every hour
    const intervalId = setInterval(() => {
      this.run();
    }, 60 * 60 * 1000); // 1 hour in milliseconds
    
    console.log('✅ Event status job scheduler started (runs every hour)');
    
    return intervalId;
  }

  /**
   * Stop the periodic job
   */
  static stop(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('🛑 Event status job scheduler stopped');
    }
  }
}

module.exports = EventStatusJob;