<script setup>
  // Import modules and components
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import { worlds, dataCenters } from '../components/settings';

  // Reactive variables
  const route = useRoute();
  const itemId = ref(parseInt(route.params.itemId));
  const itemData = ref({
    name: 'Loading...',
    category: '',
    description: '',
    image: '',
  });
  const marketData = ref(null);
  const loading = ref(true);
  const error = ref(null);

  // Filtering variables
  const selectedDataCenter = ref("Europe");
  const selectedWorld = ref("");

  // Watch when selectedDataCenter changes and fetch the items with the new value (reset selectedWorld)
  watch(selectedDataCenter, async () => {
    fetchMarketData();
    selectedWorld.value = "";
  });

  // Computed filtered listings
  const filteredListings = computed(() => {
    if (!marketData.value) return [];
    return marketData.value.listings.filter((listing) => {
      const matchesDataCenter = selectedDataCenter.value
        ? dataCenters[selectedDataCenter.value]?.includes(listing.worldID)
        : true;
      const matchesWorld = selectedWorld.value
        ? listing.worldID === selectedWorld.value
        : true;
      return matchesDataCenter && matchesWorld;
    });
  });

  const filteredHistory = computed(() => {
    if (!marketData.value) return [];
    return marketData.value.recentHistory.filter((sale) => {
      const matchesDataCenter = selectedDataCenter.value
        ? dataCenters[selectedDataCenter.value]?.includes(sale.worldID)
        : true;
      const matchesWorld = selectedWorld.value
        ? sale.worldID === selectedWorld.value
        : true;
      return matchesDataCenter && matchesWorld;
    });
  });

  // Fetch item details from XIVAPI
  const fetchItemDetails = async () => {
    try {
      const response = await axios.get(`https://v2.xivapi.com/api/sheet/Item/${itemId.value}?fields=Name,Description,ItemUICategory,StackSize,Icon`);
      const data = response.data;

      // Universalis API image URL
      const universalisImageUrl = `https://universalis-ffxiv.github.io/universalis-assets/icon2x/${itemId.value}.png`;

      // Check if the Universalis image exists
      const imageExists = `https://universalis-ffxiv.github.io/universalis-assets/icon2x/${itemId.value}.png`;

      // Fallback to XIVAPI icon if Universalis image doesn't exist
      let fallbackImageUrl = '';
      if (data.fields?.Icon?.path) {
        const urlParts = data.fields.Icon.path.split("/");
        fallbackImageUrl = `https://xivapi.com/i/${urlParts[2]}/${urlParts[3].replace(".tex", ".png")}`;
      }

      itemData.value = {
        name: data.fields.Name,
        category: `${data.fields.ItemUICategory?.fields?.Name} - Stack: ${data.fields.StackSize}`,
        description: data.fields.Description,
        image: imageExists ? universalisImageUrl : fallbackImageUrl, // This should prioritise Universalis, but will fallback to XIV if it doesn't exist within Universalis's API
      };
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
  };

  // Fetch data from Universalis API dynamically
  const fetchMarketData = async () => {
    try {
      loading.value = true;
      const apiUrl = `https://universalis.app/api/v2/${selectedDataCenter.value}/${itemId.value}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      marketData.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Fetch data on component mount
  onMounted(() => {
    fetchItemDetails();
    fetchMarketData();
  });
</script>

<template>
  <main>
    <div v-if="loading">Loading market data...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-else>

      <!-- Item Details -->
      <div class="item-header">
        <div class="image-container">
          <img :src="itemData.image" alt="Item Icon" class="item-image" />
        </div>
        <div class="item-details">
          <h1 class="item-name">{{ itemData.name }}</h1>
          <p class="item-category">{{ itemData.category }}</p>
          <div class="item-stats">
            <p class="item-description">{{ itemData.description }}</p>
          </div>
        </div>
      </div>

      <!-- Filtering Controls -->
      <div class="filters">
        <div class="data-center-table">
          <!-- Data Center Selection -->
          <div class="worlds-grid">
            <div
              class="data-center-header world"
              :class="{ active: selectedDataCenter === 'Europe' && !selectedWorld }"
              @click="(selectedDataCenter = 'Europe', selectedWorld = '')"
            >
              Europe
            </div>

            <!-- Worlds List -->
            <div
              v-for="worldId in dataCenters['Europe']"
              :key="worldId"
              class="world"
              :class="{ active: selectedWorld === worldId }"
              @click="selectedWorld = worldId"
            >
              {{ worlds[worldId] || worldId }}
            </div>
          </div>
        </div>
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
                <td>{{ worlds[listing.worldName] || `Server ${listing.worldName}` }}</td>
                <td>{{ listing.pricePerUnit }}</td>
                <td>{{ listing.quantity }}</td>
                <td>{{ listing.retainerName }}</td>
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
                <td>{{ sale.worldName || worlds[sale.worldName] }}</td>
                <td>{{ sale.pricePerUnit }}</td>
                <td>{{ sale.quantity }}</td>
                <td>{{ sale.buyerName }}</td>
                <td>{{ new Date(sale.timestamp * 1000).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
  main {
    font-family: Arial, sans-serif;
    padding: 1rem;
  }

  /* Styles for World/DC Filtering */
  .filters {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .data-center-table {
    display: flex;
    gap: 4px;
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 8px;
    max-width: 100%;
    overflow-x: auto;
    border: 1px solid #ddd;
  }

  /* This part will be on the worlds and Data Centers available */
  .worlds-grid {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
    padding-top: 5px;
  }

  .world {
    background-color: #ffffff;
    padding: 8px 12px;
    color: #333;
    border: 1px solid #ccc;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    text-align: center;
    font-weight: bold;
    min-width: 100px;
  }

  .world:hover {
    background-color: #f0f0f0;
  }

  .world.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
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

  thead {
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

  /* Item Details */
  .item-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .image-container {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 10px;
    overflow: hidden;
  }

  /* Controls the image size */
  .item-image {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    box-sizing: border-box;
    padding: 0;
    border: none;
    margin: auto;
    display: block;
    width: 0;
    height: 0;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
  }

  /* Controls the styles of item name */
  .item-name {
    font-size: 1.5rem;
    margin: 0;
    font-weight: bold;
  }

  /* Controls the styles of item category */
  .item-category {
    font-size: 1rem;
    color: #666;
    margin: 0.5rem 0;
  }

  .item-stats {
    margin-top: 0.25rem;
  }

  /* Controls the styles of item description */
  .item-description {
    font-size: 0.875rem;
    color: #444;
    margin: 0.25rem 0;
    font-style: italic;
  }
</style>
