<script setup>
import { computed } from 'vue';
import { useNotificationStore } from '../stores/notification';

const notificationStore = useNotificationStore();
// Use a computed property to reactively get the notifications
const notifications = computed(() => notificationStore.notifications);
</script>

<template>
  <div class="notification-wrapper">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="notification"
      :class="notification.type"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.notification-wrapper {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 1000;
}

.notification {
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 3px;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.notification.success {
  border-color: #28a745;
}

.notification.error {
  border-color: #dc3545;
}
</style>