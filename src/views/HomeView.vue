<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import axios from 'axios';
  import { initializeWebSocket, closeWebSocket } from '../components/websocketService';
  import { dataCenters, worlds } from '../components/settings';
  import { SITE_NAME } from '../components/settings.js';

  // Reactive variables
  const listings = ref([]);
  const selectedDataCenter = ref("Light"); // Change this based on user selection
  const selectedServer = ref(null);
  const stopUpdating = ref(false); // Stops updating after 15 entries

  // Least Updated Items
  const leastUpdatedItems = ref([]);

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

  // Fetch item names dynamically
  const fetchItemNames = async (itemIDs) => {
    try {
      const itemDetailsPromises = itemIDs.map((id) =>
        axios.get(`https://xivapi.com/item/${id}`)
      );
      const responses = await Promise.all(itemDetailsPromises);
      return responses.map((response) => ({
        id: response.data.ID,
        name: response.data.Name,
      }));
    } catch (error) {
      console.error('Error fetching item names:', error);
      return [];
    }
  };

  // Fetch least recently updated items
  const fetchLeastUpdatedItems = async () => {
    try {
      const response = await axios.get('https://universalis.app/api/marketable');
      const marketableItems = response.data.slice(0, 5);
      const itemNames = await fetchItemNames(marketableItems);

      leastUpdatedItems.value = itemNames.map((item) => ({
        ...item,
        updatedAt: "6 months ago", // Replace with actual update timestamp if available
        server: "Light", // Replace with dynamic server if needed
      }));
    } catch (error) {
      console.error('Error fetching least updated items:', error);
    }
  };

  // Function to update listings
  const updateListings = (newData) => {
    if (!stopUpdating.value) {
      listings.value = [...newData, ...listings.value].slice(0, 6);
      if (listings.value.length >= 6) {
        stopUpdating.value = true;
      }
    }
  };

  // WebSocket Setup
  onMounted(async () => {
    try {
      // Fetch least updated items when the component mounts
      await fetchLeastUpdatedItems();

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
  <div class="container-fluid bg-light min-vh-100">
    <div class="row">
      <!-- Sidebar -->
      <aside class="col-md-3">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="text-center">Logged-out</h2>
            <p class="text-center">Lists, Alerts, Market activity, and retainer links will show here when you are logged into the site.</p>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <!-- Welcome Message -->
      <main class="col-md-6 py-4">
        <div class="card mb-4">
          <div class="card-body">
            <h1 class="card-title">Welcome to {{ SITE_NAME }}!</h1>
            <p class="card-text">
              {{ SITE_NAME }} is a market board data site powered by Universalis's API, with crowd-sourced information. It aggregates market board information from multiple sources.
            </p>
          </div>
        </div>

        <!-- Sign in Card -->
        <div class="card">
          <div class="card-body">
            <h2 class="card-title">Sign in!</h2>
            <p class="card-text">Create alerts, make lists, add your retainers, and get a personalised home page feed!</p>
          </div>
        </div>

        <!-- Least Recently Updated Items -->
        <div class="container mt-5">
        <h2 class="text-center mb-4">Least Recently Updated on {{ selectedDataCenter }}</h2>
        <ul class="list-group">
          <li
            v-for="item in leastUpdatedItems" 
            :key="item.itemID" 
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong class="text-primary">{{ item.name }}</strong>
              <br />
              <small class="text-muted">{{ item.category }}</small>
            </div>
            <small class="text-muted">
              Last updated: {{ item.updatedAt }} on {{ item.server }}
            </small>
          </li>
        </ul>
      </div>
      </main>

      <!-- Right Sidebar -->
      <aside class="col-md-3 bg-light py-4">
        <div class="mb-4">
          <h2 class="text-center">Recent Updates</h2>
          <ul class="list-group">
            <li
              v-for="item in recentItems"
              :key="item.id"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong class="text-primary">{{ item.name }}</strong>
                <br />
                <small class="text-muted">Server: {{ item.server }}</small>
              </div>
          </li>
        </ul>
        </div>

        <div class="mb-4">
          <h2 class="text-center">Current Market Tax Rates on Zodiark</h2>
          <div class="d-flex justify-content-around">
            <span class="badge bg-primary">5%</span>
            <span class="badge bg-secondary">3%</span>
          </div>
        </div>

        <div>
          <h2 class="text-center">Upload Counts by World</h2>
          <div class="bg-secondary rounded p-4 text-center text-white">Chart Placeholder</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
  .container-fluid {
    min-height: 100vh;
  }

  .card {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
</style>