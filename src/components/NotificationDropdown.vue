<script setup>
  import { computed } from 'vue';
  import { useNotificationStore } from '../stores/notification';

  // Access the notification store
  const notificationStore = useNotificationStore();
  const notifications = computed(() => notificationStore.historicalNotifications);

  // Function to remove a notification from history
  const removeNotification = (id) => {
    notificationStore.removeHistoricalNotification(id);
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    notificationStore.clearHistoricalNotifications();
  };
</script>

<template>
  <div class="notification-dropdown">
    <div class="notification-header">
      <h3>Notifications</h3>
      <button v-if="notifications.length > 0" @click="clearAllNotifications" class="clear-all-btn">
        Clear All
      </button>
    </div>
    
    <div v-if="notifications.length > 0" class="notification-list">
      <div v-for="notification in notifications" :key="notification.id" class="notification-item" :class="notification.type">
        <div class="notification-content">
          {{ notification.message }}
          <div class="notification-time" v-if="notification.timestamp">
            {{ new Date(notification.timestamp).toLocaleString() }}
          </div>
        </div>
        <button @click="removeNotification(notification.id)" class="remove-btn" title="Remove">×</button>
      </div>
    </div>
    <div v-else class="no-notifications">
      No notifications
    </div>
  </div>
</template>

<style scoped>
.notification-dropdown {
    position: absolute;
    right: 10px;
    top: 60px;
    z-index: 999;
    background-color: #2a2f36;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid #40474f;
}

.notification-header h3 {
    margin: 0;
    color: white;
    font-size: 16px;
}

.notification-list {
    max-height: 320px;
    overflow-y: auto;
}

.notification-item {
    padding: 8px;
    margin-bottom: 5px;
    border-radius: 6px;
    background-color: #343a40;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.notification-item.success {
    border-left: 3px solid #28a745;
}

.notification-item.error {
    border-left: 3px solid #dc3545;
}

.notification-content {
    flex: 1;
}

.notification-time {
    font-size: 11px;
    color: #aaa;
    margin-top: 3px;
}

.no-notifications {
    padding: 10px;
    text-align: center;
    color: #888;
}

.remove-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 16px;
    cursor: pointer;
    margin-left: 8px;
    padding: 0 5px;
}

.remove-btn:hover {
    color: white;
}

.clear-all-btn {
    background-color: #40474f;
    border: none;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.clear-all-btn:hover {
    background-color: #4d5761;
}
</style>