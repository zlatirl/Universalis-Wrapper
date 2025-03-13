import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [], // Active notifications
    historicalNotifications: JSON.parse(localStorage.getItem('historicalNotifications') || '[]'), // Historical notifications that persist
    sessionNotifications: new Set(JSON.parse(localStorage.getItem('sessionNotifications') || '[]')), // Track notifications shown during the session
  }),
  actions: {
    addNotification(notification) {
      // Check if a custom ID was provided, otherwise use timestamp
      if (!notification.id) {
        notification.id = Date.now();
      }

      // Create a deep copy of the notification to avoid reference issues
      const notificationCopy = { ...notification };
      
      // Add timestamp for historical reference
      notificationCopy.timestamp = new Date().toISOString();

      // Add the notification to both active and historical arrays
      this.notifications.push(notificationCopy); // Active notifications
      
      // Add to beginning of historical notifications
      this.historicalNotifications.unshift(notificationCopy);
      
      // Limit historical notifications to prevent excessive storage
      if (this.historicalNotifications.length > 50) {
        this.historicalNotifications = this.historicalNotifications.slice(0, 50);
      }

      // Save historical notifications to localStorage
      localStorage.setItem('historicalNotifications', JSON.stringify(this.historicalNotifications));

      // Mark the notification as shown during the session
      this.sessionNotifications.add(notificationCopy.id);

      // Save the sessionNotifications to localStorage
      localStorage.setItem('sessionNotifications', JSON.stringify([...this.sessionNotifications]));

      // Automatically remove the notification from the active list after the specified timeout
      // This only affects the toast notification, not the historical record
      setTimeout(() => {
        this.removeNotification(notificationCopy.id); // Remove from active notifications
      }, notificationCopy.timeout || 3000);
    },
    removeNotification(id) {
      // Filter out the notification with the specified ID from the active list
      this.notifications = this.notifications.filter(n => n.id !== id);
    },
    removeHistoricalNotification(id) {
      // Filter out the notification with the specified ID from the historical list
      this.historicalNotifications = this.historicalNotifications.filter(n => n.id !== id);
      
      // Update localStorage after removing a notification
      localStorage.setItem('historicalNotifications', JSON.stringify(this.historicalNotifications));
    },
    clearHistoricalNotifications() {
      // Clear all historical notifications
      this.historicalNotifications = [];
      
      // Update localStorage after clearing
      localStorage.setItem('historicalNotifications', JSON.stringify([]));
    },
    hasSeenNotification(id) {
      // Check if a notification has already been shown during the session
      return this.sessionNotifications.has(id);
    },
    startClearInterval() {
      setInterval(() => {
        this.clearHistoricalNotifications();
      }, 2 * 60 * 60 * 1000); // 2 hours

    },
  },
});