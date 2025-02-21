<script setup>
  // Import modules and components
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import axios from 'axios';
  import { initializeWebSocket, closeWebSocket } from '../components/websocketService';
  import { dataCenters, worlds } from '../components/settings';
  import { SITE_NAME } from '../components/settings.js';

  // Reactive variables
  const listings = ref([]);
  const selectedDataCenter = ref("Light"); // Change this based on user selection
  const selectedServer = ref(null);

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

  // Reactive variable for tax rates
  const taxRates = ref([]);

  // Util to throttle recent items update
  const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // Grab Tax Rates from API
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

  // Grab the most recent items from the API
  const updateRecentItems = async () => {
    try {
      const response = await axios.get('https://universalis.app/api/v2/extra/stats/recently-updated');
      const data = response.data;

      if (!data.items || data.items.length === 0) {
        console.warn("No recent updates found.");
        return;
      }

      // Extract item IDs
      const itemIDs = data.items;

      // Fetch item names from XIVAPI
      const itemNames = await fetchItemsFromXIVAPI(itemIDs);

      // Map and update recentItems
      recentItems.value = itemIDs.map((id) => {
        const foundItem = itemNames.find(i => i.row_id === id);
        return {
          id,
          name: foundItem ? foundItem.fields.Name : `Unknown (${id})`,
          category: foundItem ? foundItem.fields.Category : "Unknown Category",
          image: foundItem ? foundItem.image : "", // Use the corrected image URL
          link: `/item/${id}`
        };
      }).slice(0, 6);

    } catch (error) {
      console.error('Error updating recent items:', error);
    }
  };

  // Throttle the updateRecentItems function to run at most one per minute
  const throttledUpdateRecentItems = throttle(updateRecentItems, 60000);

  // Fetch item names from XIVAPI using the same logic as in App.vue
  const fetchItemsFromXIVAPI = async (itemIDs) => {
    try {
      const itemPromises = itemIDs.map(id =>
        axios.get(`https://v2.xivapi.com/api/sheet/Item/${id}?fields=Name,Description,ItemUICategory,Icon`)
      );

      // Wait for all requests to complete
      const responses = await Promise.all(itemPromises);

      // Map the responses to return structured data
      const items = responses.map(response => {
        const data = response.data;

        // Ensure Icon exists and construct correct image URL
        let iconPath = "";
        if (data.fields?.Icon?.path) {
          const urlParts = data.fields.Icon.path.split("/"); // Split the icon path into parts
          iconPath = `https://xivapi.com/i/${urlParts[2]}/${urlParts[3].replace(".tex", ".png")}`; // Convert .tex to .png
        }

        // Return an object with item details, including name, category, and icon image
        return {
          row_id: data.row_id,
          fields: {
            Name: data.fields.Name,
            Category: data.fields.ItemUICategory?.fields?.Name || "Unknown Category",
          },
          image: iconPath,
        };
      });

      return items;
    } catch (error) {
      console.error('Error fetching item names:', error);
      return [];
    }
  };

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
      const response = await axios.get('https://universalis.app/api/v2/extra/stats/least-recently-updated?world=twintania&dcName=light&entries=6');
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

  // WebSocket Setup
  onMounted(async () => {
    try {
      // Fetch least updated items when the component mounts
      leastUpdatedItems.value = await fetchLeastUpdatedItems();

      await initializeWebSocket((message) => {
        if (message.listings) {
          throttledUpdateRecentItems();
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
              <a :href="`/item/${item.id}`" class="item-link">
                <strong class="text-primary">{{ item.name }}</strong>
              </a>
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
        <div class="recent-updates">
          <h2>Recent Updates</h2>
          <ul class="list-group">
              <li v-for="item in recentItems" :key="item.id" class="list-group-item">
                <a :href="`/item/${item.id}`" class="item-image-link">
                  <img :src="item.image" alt="Item Icon" class="item-image" />
                </a>
                  <div class="item-details">
                      <a :href="`/item/${item.id}`" class="item-name">{{ item.name }}</a>
                      <small class="item-category">{{ item.category }}</small>
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

  /* Market Tax Card Styling */
  .market-tax-card {
    background-color: #fff;
    color: #000;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 450px;
    margin-top: 10px;
  }

  /* City Image Styles */
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

  .item-link {
    color: #007bff;
    text-decoration: none;
  }

  /* Recent Updates Container */
  .recent-updates {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  /* Title Styling */
  .recent-updates h2 {
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    padding: 8px;
    background-color: #e0e0e0;
    border-radius: 6px 6px 0 0;
  }

  /* List Group */
  .recent-updates .list-group {
    border-radius: 8px;
    overflow: hidden;
  }

  /* Individual List Items */
  .recent-updates .list-group-item {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border: none;
    padding: 10px 12px;
    border-bottom: 1px solid #d1d1d1;
    transition: background-color 0.2s ease-in-out;
  }

  /* Add box shadow to the last item */
  .recent-updates .list-group-item:last-child {
    border-radius: 0 0 8px 8px;
  }

  /* Item Image */
  .recent-updates .item-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 6px;
    margin-right: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  /* Item Details */
  .recent-updates .item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Item Name */
  .recent-updates .item-name {
    font-size: 16px;
    font-weight: bold;
    color: #007bff;
    transition: color 0.2s ease-in-out;
    text-decoration: none;
  }

  /* Item Category */
  .recent-updates .item-category {
    font-size: 14px;
    color: #6c757d;
  }

  /* Adjustments for compact layout */
  .recent-updates .list-group-item {
    padding: 8px;
  }
</style>
