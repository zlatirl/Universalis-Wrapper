<script setup>
  // Import modules and components
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  import { worlds, dataCenters, dataCentersGroups } from '../components/settings';

  // Reactive variables
  const route = useRoute();
  const itemId = ref(parseInt(route.params.itemId));
  const itemData = ref({
    name: 'Loading...',
    category: '',
    description: '',
    image: '',
  });
  const marketData = ref({
    hqListings: [],
    nqListings: [],
    recentHistory: [],
  });
  const loading = ref(true);
  const error = ref(null);

  // Filtering variables
  const selectedDataCenter = ref("Europe");
  const selectedWorld = ref("");
  const latestUpdates = ref({});
  const savedItems = ref(JSON.parse(localStorage.getItem('savedItems') || '[]'));
  const recentlyViewedItems = ref(JSON.parse(localStorage.getItem('recentlyViewedItems') || '[]'));

  // Retrieve saved server from localStorage
  const savedServer = localStorage.getItem('selectedServer');
  if (savedServer) {
    // Find the data center for the saved server
    const serverId = Object.entries(worlds).find((item) => item[1] === savedServer)?.[0];
    if (serverId) {
      for (const [dc, worldIds] of Object.entries(dataCenters)) {
        if (worldIds.includes(parseInt(serverId))) {
          selectedDataCenter.value = dc;
          break;
        }
      }
    }
  }

  // Checks if the current item is saved
  const isItemSaved = computed(() => {
    return savedItems.value.some(item => item.id === itemId.value);
  });

  // Function to toggle the saved state of the item
  const toggleSaveItem = () => {
    if (isItemSaved.value) {
      // Remove the item if it is already saved
      savedItems.value = savedItems.value.filter(item => item.id !== itemId.value);
    } else {
      // Add the item to the saved list
      savedItems.value.push({
        id: itemId.value,
        name: itemData.value.name,
        image: itemData.value.image,
        category: itemData.value.category,
        savedAt: new Date().toISOString()
      });
    }

    localStorage.setItem('savedItems', JSON.stringify(savedItems.value));
  }

  // Computed property to find the cheapest HQ listing
  const cheapestHQListing = computed(() => {
    if (marketData.value.hqListings.length === 0) return null;
    return marketData.value.hqListings.reduce((cheapest, listing) => {
      return listing.pricePerUnit < cheapest.pricePerUnit ? listing : cheapest;
    });
  });

  // Computed property to find the cheapest NQ listing
  const cheapestNQListing = computed(() => {
    if (marketData.value.nqListings.length === 0) return null;
    return marketData.value.nqListings.reduce((cheapest, listing) => {
      return listing.pricePerUnit < cheapest.pricePerUnit ? listing : cheapest;
    });
  });

  // Function to add the current item to recently viewed items
  const addToRecentlyViewed = () => {
    const existingItemIndex = recentlyViewedItems.value.findIndex(i => i.id === itemId.value);
    if (existingItemIndex !== -1) {
      recentlyViewedItems.value.splice(existingItemIndex, 1);
    }
    recentlyViewedItems.value.unshift({
      id: itemId.value,
      name: itemData.value.name,
      image: itemData.value.image,
      category: itemData.value.category,
      viewedAt: new Date().toISOString()
    });
    if (recentlyViewedItems.value.length > 5) {
      recentlyViewedItems.value.pop();
    }
    localStorage.setItem('recentlyViewedItems', JSON.stringify(recentlyViewedItems.value));
  };

  // Watch when selectedDataCenter changes and fetch the items with the new value (reset selectedWorld)
  watch(selectedDataCenter, async () => {
    fetchMarketData();
    selectedWorld.value = "";
  });

  // Watch when selectedWorld changes and fetch data for the selected server
  watch(selectedWorld, async () => {
    console.log("Selected world changed to:", selectedWorld.value);
    fetchMarketData();
  });

  // Computed filtered listings - HQ
  const filteredHqListings = computed(() => {
    return marketData.value.hqListings || [];
  });

  // Computed filtered listings - NQ
  const filteredNqListings = computed(() => {
    return marketData.value.nqListings || [];
  });

  const filteredHistory = computed(() => {
    return marketData.value.recentHistory || [];
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
        image: imageExists ? universalisImageUrl : errorImagePath, // This should prioritise Universalis, but will fallback to XIV if it doesn't exist within Universalis's API
      };

      addToRecentlyViewed();
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
  };

  // Fetch data from Universalis API dynamically
  const fetchMarketData = async (isInitialLoad = false) => {
    try {
      // Only set loading to true if it's the initial load or a manual refresh
      if (isInitialLoad) {
        loading.value = true;
      }

      // Determine the API endpoint based on the selected server or data center
      const endpoint = selectedWorld.value
        ? `${selectedWorld.value}/${itemId.value}`
        : `${selectedDataCenter.value}/${itemId.value}`;

      const apiUrl = `https://universalis.app/api/v2/${endpoint}?listings=30&entries=10`;
      console.log("Fetching data from:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched data:", data); // Debugging log

      // Process the data to separate HQ and NQ listings
      marketData.value = {
        hqListings: data.listings ? data.listings.filter(listing => listing.hq).slice(0, 10) : [],
        nqListings: data.listings ? data.listings.filter(listing => !listing.hq).slice(0, 10) : [],
        recentHistory: data.recentHistory ? data.recentHistory.slice(0, 10) : [],
      };

      if (data.worldUploadTimes) {
        latestUpdates.value = data.worldUploadTimes;
      }

      console.log("Processed market data:", marketData.value); // Debugging log
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching market data:", err); // Debugging log
    } finally {
      loading.value = false;
    }
  };

  // Format the time to string
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'never';
    
    const now = new Date();
    const updatedTime = new Date(timestamp);
    const diffMs = now - updatedTime;
    
    // Convert to minutes, hours, etc.
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Fetch data on component mount
  onMounted(() => {
    fetchItemDetails();
    fetchMarketData(true);
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

        <!-- Save Button -->
        <button @click="toggleSaveItem" class="save-button" :class="{ 'saved': isItemSaved }">
          {{ isItemSaved ? 'Unsave' : 'Save' }}
        </button>
      </div>

      <!-- Filtering Controls -->
      <div class="filters">
        <div class="data-center-table">
          <!-- Data Center Selection -->
          <div class="worlds-grid">
            <div class="data-center-header world" :class="{ active: !selectedWorld }"
              @click="(selectedDataCenter = selectedDataCenter, selectedWorld = '')">
              {{ selectedDataCenter }}
            </div>

            <!-- Worlds List -->
            <div v-for="worldId in dataCenters[selectedDataCenter]" :key="worldId" class="world"
              :class="{ active: parseInt(selectedWorld) === worldId }" @click="selectedWorld = worldId">
              {{ worlds[worldId] || worldId }}
            </div>
          </div>
        </div>
      </div>

      <!-- Latest Updates Section -->
      <section class="latest-updates">
        <div class="updates-grid">
          <div v-for="(timestamp, worldId) in latestUpdates" :key="worldId" class="update-item">
            <div class="world-name">{{ worlds[worldId] || worldId }}</div>
            <div class="update-time">{{ formatTimeAgo(timestamp) }}</div>
          </div>
          <div v-if="Object.keys(latestUpdates).length === 0" class="no-updates">
            No update information available
          </div>
        </div>
      </section>

      <!-- Cheapest HQ/NQ Section -->
      <div v-if="cheapestHQListing || cheapestNQListing" class="cheapest-listings" 
          :class="{ 'single-listing': (!cheapestHQListing || !cheapestNQListing) }">
        <div v-if="cheapestHQListing" class="cheapest-listing">
          <h3>Cheapest HQ</h3>
          <div class="listing-details">
            <div class="left-section">
              <p><strong>Price:</strong> {{ cheapestHQListing.pricePerUnit }}</p>
              <p><strong>Quantity:</strong> {{ cheapestHQListing.quantity }}</p>
            </div>
            <div class="right-section">
              <p><strong>Retainer:</strong> {{ cheapestHQListing.retainerName }}</p>
              <p v-if="!selectedWorld"><strong>Server:</strong> {{ worlds[cheapestHQListing.worldID] || cheapestHQListing.worldID }}</p>
            </div>
          </div>
          <div class="total">
            <p><strong>Total Price:</strong> {{ cheapestHQListing.pricePerUnit * cheapestHQListing.quantity }}</p>
          </div>
        </div>

        <!-- Display Cheapest NQ Listing -->
        <div v-if="cheapestNQListing" class="cheapest-listing">
          <h3>Cheapest NQ</h3>
          <div class="listing-details">
            <div class="left-section">
              <p><strong>Price:</strong> {{ cheapestNQListing.pricePerUnit }}</p>
              <p><strong>Quantity:</strong> {{ cheapestNQListing.quantity }}</p>
            </div>
            <div class="right-section">
              <p><strong>Retainer:</strong> {{ cheapestNQListing.retainerName }}</p>
              <p v-if="!selectedWorld"><strong>Server:</strong> {{ worlds[cheapestNQListing.worldID] || cheapestNQListing.worldID }}</p>
            </div>
          </div>
          <div class="total">
            <p><strong>Total Price:</strong> {{ cheapestNQListing.pricePerUnit * cheapestNQListing.quantity }}</p>
          </div>
        </div>
      </div>

      <!-- Side-by-Side Layout -->
      <div class="grid-container">
        <!-- HQ Prices Section -->
        <section v-if="filteredHqListings.length > 0">
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
              <tr v-for="(listing, index) in filteredHqListings" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ worlds[listing.worldID] || listing.worldID }}</td>
                <td>{{ listing.pricePerUnit }}</td>
                <td>{{ listing.quantity }}</td>
                <td>{{ listing.retainerName }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- NQ Prices Section -->
        <section v-if="filteredNqListings.length > 0">
          <h2>NQ Prices</h2>
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
              <tr v-for="(listing, index) in filteredNqListings" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ worlds[listing.worldID] || listing.worldID }}</td>
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
                <td>{{ worlds[sale.worldID] || sale.worldID }}</td>
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

  /* Styles for Latest Updates */
  .latest-updates {
    margin: 2rem 0;
  }

  .updates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .update-item {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 0.75rem;
    border: 1px solid #eee;
  }

  .world-name {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .update-time {
    color: #666;
    font-size: 0.875rem;
  }

  .no-updates {
    grid-column: 1 / -1;
    text-align: center;
    color: #888;
    padding: 1rem;
  }

  /* Styles for Cheapest Listings */
  .cheapest-listings {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .cheapest-listing {
    flex: 1;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #eee;
  }

  .cheapest-listing h3 {
    margin-top: 0;
    font-size: 1.25rem;
    color: #333;
    text-align: center;
  }

  .listing-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .cheapest-listing .retainer-server {
    text-align: right;
    float: right;
  }

  .left-section {
    text-align: left;
  }

  .right-section {
    text-align: right;
  }
  
  .total {
    text-align: center;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
  }

  .cheapest-listing p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
    color: #555;
  }

  .cheapest-listing strong {
    font-weight: bold;
    color: #000;
  }

  /* Styles if there's only 1 Cheapest HQ or NQ Card */
  .cheapest-listings.single-listing {
    justify-content: flex-start;
  }
    
  .cheapest-listings.single-listing .cheapest-listing {
    flex: 0 1 auto;
    max-width: 400px;
    margin-right: 0;
    margin-left: 0;
  }
</style>
