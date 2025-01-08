<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { initializeWebSocket, closeWebSocket } from '../components/websocketService';
import { dataCenters, worlds } from '../components/settings';

// Reactive variables
const listings = ref([]);
const selectedDataCenter = ref(null);
const selectedServer = ref(null);
const stopUpdating = ref(false); // Stops updating after 15 entries

// Filtered Listings
const filteredListings = computed(() => {
  if (!selectedDataCenter.value && !selectedServer.value) return listings.value;

  return listings.value.filter((listing) => {
    const isInDataCenter = selectedDataCenter.value
      ? dataCenters[selectedDataCenter.value]?.includes(listing.worldId)
      : true;
    const isInServer = selectedServer.value
      ? listing.worldId === selectedServer.value
      : true;

    return isInDataCenter && isInServer;
  });
});

// Function to update listings
const updateListings = (newData) => {
  if (!stopUpdating.value) {
    listings.value = [...newData, ...listings.value].slice(0, 50);
    if (listings.value.length >= 50) {
      stopUpdating.value = true;
    }
  }
};

// WebSocket Setup
onMounted(async () => {
  try {
    await initializeWebSocket((message) => {
      if (message.listings) {
        const newListings = message.listings.map((listing) => ({
          itemId: message.item,
          worldId: message.world,
          pricePerUnit: listing.pricePerUnit,
          quantity: listing.quantity,
          retainerName: listing.retainerName,
        }));
        updateListings(newListings);
      }
    });
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
  }
});

onUnmounted(async () => {
  try {
    await closeWebSocket();
  } catch (error) {
    console.error('Error closing WebSocket:', error);
  }
});
</script>

<template>
  <main>
    <h2>Recently Added Items</h2>

    <nav>
      <router-link :to="{ name: 'item', params: { itemId: 44162 } }">View Dummy Item</router-link>
    </nav>

    <!-- Filters -->
    <div>
      <label for="dataCenter">Filter by Data Center:</label>
      <select id="dataCenter" v-model="selectedDataCenter">
        <option value="">All</option>
        <option v-for="(servers, dcName) in dataCenters" :key="dcName" :value="dcName">
          {{ dcName }}
        </option>
      </select>

      <label for="server">Filter by Server:</label>
      <select id="server" v-model="selectedServer" :disabled="!selectedDataCenter">
        <option value="">All</option>
        <option
          v-for="worldId in dataCenters[selectedDataCenter] || []"
          :key="worldId"
          :value="worldId"
        >
          {{ worlds[worldId] || `World ${worldId}` }}
        </option>
      </select>
    </div>

    <!-- Data Table -->
    <table>
      <thead>
        <tr>
          <th>Item ID</th>
          <th>World Name</th>
          <th>Price Per Unit</th>
          <th>Quantity</th>
          <th>Retainer Name</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="listing in filteredListings"
          :key="listing.itemId + listing.worldId + listing.pricePerUnit + listing.retainerName"
        >
          <td>{{ listing.itemId }}</td>
          <td>{{ worlds[listing.worldId] || `World ${listing.worldId}` }}</td>
          <td>{{ listing.pricePerUnit }}</td>
          <td>{{ listing.quantity }}</td>
          <td>{{ listing.retainerName }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

