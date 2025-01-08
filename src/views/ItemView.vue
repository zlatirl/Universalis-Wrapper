<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { worlds, itemIDs, dataCenters } from '../components/settings'; // Import settings.js data

// Reactive variables
const route = useRoute();
const itemId = ref(parseInt(route.params.itemId)); // Get itemId dynamically from route
const world = ref('Cerberus'); // Default world
const marketData = ref(null);
const loading = ref(true);
const error = ref(null);

// Filtering variables
const selectedDataCenter = ref(null);
const selectedWorld = ref(null);

// Computed filtered listings
const filteredListings = computed(() => {
  if (!marketData.value) return [];
  return marketData.value.listings.filter((listing) => {
    const matchesDataCenter =
      selectedDataCenter.value
        ? dataCenters[selectedDataCenter.value]?.includes(listing.world)
        : true;
    const matchesWorld =
      selectedWorld.value ? listing.world === selectedWorld.value : true;
    return matchesDataCenter && matchesWorld;
  });
});

const filteredHistory = computed(() => {
  if (!marketData.value) return [];
  return marketData.value.recentHistory.filter((sale) => {
    const matchesDataCenter =
      selectedDataCenter.value
        ? dataCenters[selectedDataCenter.value]?.includes(sale.world)
        : true;
    const matchesWorld =
      selectedWorld.value ? sale.world === selectedWorld.value : true;
    return matchesDataCenter && matchesWorld;
  });
});

// Fetch data from Universalis API dynamically
const fetchMarketData = async () => {
  try {
    const apiUrl = `https://universalis.app/api/v2/${world.value}/${itemId.value}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    marketData.value = await response.json();

    // Debugging: Log world IDs from Universalis data
    console.log('Listings:', marketData.value.listings.map((l) => l.world));
    console.log('Recent History:', marketData.value.recentHistory.map((s) => s.world));
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchMarketData();
});
</script>

<template>
  <main>
    <h1>Item Details (ID: {{ itemId }})</h1>
    <p v-if="loading">Loading market data...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Filtering Controls -->
    <div class="filters">
      <label for="dataCenter">Filter by Data Center:</label>
      <select id="dataCenter" v-model="selectedDataCenter">
        <option value="">All</option>
        <option v-for="(servers, dcName) in dataCenters" :key="dcName" :value="dcName">
          {{ dcName }}
        </option>
      </select>

      <label for="world">Filter by World:</label>
      <select id="world" v-model="selectedWorld">
        <option value="">All</option>
        <option
          v-for="worldId in dataCenters[selectedDataCenter] || Object.keys(worlds)"
          :key="worldId"
          :value="worldId"
        >
          {{ worlds[worldId] }}
        </option>
      </select>
    </div>

    <!-- Side-by-Side Layout -->
    <div class="grid-container">
      <!-- HQ Prices Section -->
      <section>
        <h2>HQ Prices</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Server</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Retainer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(listing, index) in filteredListings" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ worlds[listing.world] || `Server ${listing.world}` }}</td>
                <td>{{ listing.pricePerUnit }}</td>
                <td>{{ listing.quantity }}</td>
                <td>{{ listing.retainerName }}</td>
            </tr>
            </tbody>

            <tbody>
            <tr v-for="(sale, index) in filteredHistory" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ worlds[sale.world] || `Server ${sale.world}` }}</td>
                <td>{{ sale.pricePerUnit }}</td>
                <td>{{ sale.quantity }}</td>
                <td>{{ sale.buyerName }}</td>
                <td>{{ new Date(sale.timestamp * 1000).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Sales History Section -->
      <section>
        <h2>Sales History</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Server</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Buyer</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sale, index) in filteredHistory" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ sale.worldName || worlds[sale.world] }}</td>
              <td>{{ sale.pricePerUnit }}</td>
              <td>{{ sale.quantity }}</td>
              <td>{{ sale.buyerName }}</td>
              <td>{{ new Date(sale.timestamp * 1000).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </main>
</template>

<style scoped>
main {
  font-family: Arial, sans-serif;
  padding: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.grid-container {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

section {
  flex: 1;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

thead th {
  border-bottom: 2px solid #ccc;
  text-align: left;
  padding: 0.5rem;
}

tbody td {
  border-bottom: 1px solid #eee;
  padding: 0.5rem;
}

.error {
  color: red;
}
</style>
