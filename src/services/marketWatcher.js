import { ref } from 'vue';
import { useNotificationStore } from '../stores/notification';

export function useMarketWatcher() {
  const notificationStore = useNotificationStore();
  const savedItems = ref(JSON.parse(localStorage.getItem('savedItems') || '[]'));

  const checkBestTimeToBuyOrSell = (item, currentPrice, averagePrice) => {
    const threshold = 0.1;
    const notificationId = `buy-sell-${item.id}`; // Unique ID for this notification

    // Check if the notification has already been shown during the session
    if (notificationStore.hasSeenNotification(notificationId)) {
      return; // Skip if already shown
    }

    if (currentPrice < averagePrice * (1 - threshold)) {
      notificationStore.addNotification({
        id: notificationId, // Use the unique ID
        message: `It's a good time to buy ${item.name}!`,
        type: 'success',
        timeout: 5000,
      });
    } else if (currentPrice > averagePrice * (1 + threshold)) {
      notificationStore.addNotification({
        id: notificationId, // Use the unique ID
        message: `It's a good time to sell ${item.name}!`,
        type: 'success',
        timeout: 5000,
      });
    }
  };

  const fetchMarketDataForSavedItems = async () => {
    if (savedItems.value.length === 0) {
      return; // No saved items to check
    }

    for (const item of savedItems.value) {
      try {
        const response = await fetch(
          `https://universalis.app/api/v2/Europe/${item.id}?listings=1&entries=1`
        );
        const data = await response.json();

        if (data.listings && data.listings.length > 0) {
          const currentPrice = data.listings[0].pricePerUnit;
          const averagePrice = data.averagePrice;

          checkBestTimeToBuyOrSell(item, currentPrice, averagePrice);
        }
      } catch (error) {
        console.error(`Error fetching market data for item ${item.id}:`, error);
      }
    }
  };

  const startMarketWatcher = () => {
    fetchMarketDataForSavedItems(); // Run immediately
    setInterval(fetchMarketDataForSavedItems, 5 * 60 * 1000); // Run every 5 minutes
  };

  return {
    startMarketWatcher,
  };
}