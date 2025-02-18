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

  // Mapping for city names to their corresponding icons
  const cityIcons = {
    "Limsa Lominsa": "https://xivapi.com/i/060000/060881.png",
    "Gridania": "https://xivapi.com/i/060000/060882.png",
    "Ul'dah": "https://xivapi.com/i/060000/060883.png",
    "Ishgard": "https://xivapi.com/i/060000/060884.png",
    "Kugane": "https://xivapi.com/i/060000/060885.png",
    "Crystarium": "https://xivapi.com/i/060000/060886.png",
    "Old Sharlayan": "https://xivapi.com/i/060000/060887.png",
    "Tuliyollal": "https://xivapi.com/i/060000/060888.png"
  };

  // Least Updated Items
  const leastUpdatedItems = ref([]);

  // Recent Items
  const recentItems = ref([]);
  let shouldUpdateRecentItems = ref(true);

  // Reactive variable for tax rates
  const taxRates = ref([]);

  const fetchMarketTaxRates = async () => {
    try {
      const response = await axios.get('https://universalis.app/api/v2/tax-rates?world=zodiark');
      const data = response.data;

      taxRates.value = Object.keys(data).map(city => ({
        name: city,
        rate: data[city],
        image: cityIcons[city],
      }));
    } catch (error) {
      console.error('Error fetching tax rates:', error);
    }
  }

  // Fetch Recent Items
  const fetchRecentItems = async (itemIDs) => {
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

  // Update Recent Items
  const updateRecentItems = async (newData) => {
    if (!shouldUpdateRecentItems.value) return; // Prevent updates if toggled off

    try {
      // Fetch item details from XIVAPI
      const itemNames = await fetchItemNames(newData.map((item) => item.itemId));

      // Map item details to recentItems
      const updatedRecentItems = newData.map((item, index) => ({
        id: item.itemId, // Use the itemId from newData
        name: itemNames[index]?.name || 'Unknown', // Get the name from itemNames
        server: worlds[item.worldId] || 'Unknown', // Get the name from worlds
      }));

      // Remove duplicates by ID
      const uniqueRecentItems = updatedRecentItems.concat(recentItems.value)
        .reduce((acc, item) => {
          if (!acc.find((i) => i.id === item.id)) {
            acc.push(item);
          }
          return acc;
        }, []);

      // Limit the list to the last 6 unique items
      recentItems.value = uniqueRecentItems.slice(0, 6);
    } catch (error) {
      console.error('Error updating recent items:', error);
    }
  };

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
        category: response.data.ItemUICategory?.Name || 'Unknown Category',
        image: `https://xivapi.com${response.data.Icon}`,
      }));
    } catch (error) {
      console.error('Error fetching item names:', error);
      return [];
    }
  };

  // Fetch least recently updated items
  const fetchLeastUpdatedItems = async () => {
    try {
      const response = await axios.get('https://universalis.app/api/v2/extra/stats/least-recently-updated?world=zodiark&dcName=light&entries=6');
      const data = response.data;

      if (!data.items || data.items.length === 0) {
        console.error("No least updated items returned.");
        return [];
      }

      const itemIDs = data.items.map(item => item.itemID);
      const itemNames = await fetchItemNames(itemIDs);

      return data.items.map((item) => {
        const foundItem = itemNames.find(i => i.id === item.itemID);
        return {
          id: item.itemID,
          name: foundItem ? foundItem.name : `Unknown (${item.itemID})`,
          category: foundItem ? foundItem.category : "Unknown Category",
          image: foundItem ? foundItem.image : "",
          updatedAt: new Date(item.lastUploadTime).toLocaleString(),
          server: item.worldName,
        };
      });
    } catch (error) {
      console.error('Error fetching least updated items:', error);
      return [];
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
      leastUpdatedItems.value = await fetchLeastUpdatedItems();
      await fetchRecentItems();

      await initializeWebSocket((message) => {
        if (message.listings) {
          const newListings = message.listings.map((listing) => ({
            itemId: message.item,
            worldId: message.world,
            pricePerUnit: listing.pricePerUnit,
            quantity: listing.quantity,
            retainerName: listing.retainerName,
          }));
          updateRecentItems(newListings);
          fetchMarketTaxRates();
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

  // Allow manual refreshing of listings
  const refreshRecentItems = () => {
    shouldUpdateRecentItems.value = true;
    setTimeout(() => {
      shouldUpdateRecentItems.value = false;
    }, 5000);
  };
</script>

<template>
  <div class="container-fluid bg-light min-vh-100">
    <div class="row">
      <!-- Sidebar -->
      <aside class="col-md-3">
        <div class="card h-100">
          <div class="card-body">
            <h2 class="text-center">Saved Items</h2>
            <p class="text-center">Lists, Alerts, Market activity, and retainer links will show here soon.</p>
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

        <!-- Least Recently Updated Items -->
        <div class="container mt-5">
        <h2 class="text-center mb-4">Least Recently Updated on {{ selectedDataCenter }}</h2>
        <ul class="list-group">
          <li v-for="item in leastUpdatedItems" :key="item.id" class="list-group-item d-flex align-items-center item-container">
            <img :src="item.image" alt="Item Icon" class="item-image me-3" />
            <div>
              <strong class="text-primary">{{ item.name }}</strong>
              <br />
              <small class="text-muted">{{ item.category }}</small>
            </div>
            <small class="last-updated">
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
            <li v-for="item in recentItems" :key="item.id" class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong class="text-primary">{{ item.name }}</strong>
                <br />
                <small class="text-muted">Server: {{ item.server }}</small>
              </div>
          </li>
        </ul>
        </div>

        <div class="market-tax-card">
          <div class="card-body">
            <h3 class="text-center">Current Market Tax Rates On Zodiark</h3>
            <div class="tax-icons">
              <div v-for="tax in taxRates" :key="tax.name" class="tax-item">
                <img :src="tax.image" :alt="tax.name" class="tax-image" />
                <span class="tax-percentage">{{ tax.rate }}%</span>
              </div>
            </div>
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

  .market-tax-card {
    background-color: #fff;
    color: #000;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 450px;
    margin: 0 auto;
  }

  .tax-icons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .tax-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .tax-percentage {
    margin-top: 5px;
    font-size: 14px;
    font-weight: bold;
  }

  .last-updated {
    font-size: 12px;
    margin-left: auto;
  }
</style>
