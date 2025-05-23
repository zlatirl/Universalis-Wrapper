<script setup>
  // Import modules and components
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import axios from 'axios';
  import { initializeWebSocket, closeWebSocket } from '../components/websocketService';
  import { dataCenters, worlds } from '../components/settings';
  import { SITE_NAME } from '../components/settings.js';
  import { inject } from 'vue';

  // Reactive variables
  const selectedServer = inject('selectedServer');
  const savedItems = ref([]);
  const recentlyViewedItems = ref([]);
  const isSavedItemsOpen = ref(false);
  const isRecentlyViewedOpen = ref(false);

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

  // Function to load saved items from local storage
  const loadSavedItems = () => {
    savedItems.value = JSON.parse(localStorage.getItem('savedItems') || '[]');
  };

  // This function will remove an item from saved items
  const removeFromSaved = (itemId) => {
    savedItems.value = savedItems.value.filter(item => item.id !== itemId);
    localStorage.setItem('savedItems', JSON.stringify(savedItems.value));
  }

  // Function to load recently viewed items from local storage
  const loadRecentlyViewedItems = () => {
    recentlyViewedItems.value = JSON.parse(localStorage.getItem('recentlyViewedItems') || '[]');
  };

  // Function to add an item to recently viewed items
  const addToRecentlyViewed = (item) => {
    const existingItemIndex = recentlyViewedItems.value.findIndex(i => i.id === item.id);
    if (existingItemIndex !== -1) {
      recentlyViewedItems.value.splice(existingItemIndex, 1);
    }
    recentlyViewedItems.value.unshift(item);
    if (recentlyViewedItems.value.length > 5) {
      recentlyViewedItems.value.pop();
    }
    localStorage.setItem('recentlyViewedItems', JSON.stringify(recentlyViewedItems.value));
  };

  // Function to toggle the visibility of saved items
  const toggleSavedItems = () => {
    isSavedItemsOpen.value = !isSavedItemsOpen.value;
  };

  // Function to toggle the visibility of recently viewed items
  const toggleRecentlyViewed = () => {
    isRecentlyViewedOpen.value = !isRecentlyViewedOpen.value;
  };

  // Least Updated Items
  const leastUpdatedItems = ref([]);

  // Recent Items
  const recentItems = ref([]);

  // Reactive variable for tax rates
  const taxRates = ref([]);

  // Upload Stats
  const uploadStats = ref({ today: 0, week: 0 });

  // Util to format category
  const formatCategory = (category) => {
    if (!category) return 'Unknown Category';
    
    // Remove any stack information from the category string
    return category.replace(/\s*-?\s*Stack:.*$/i, '');
  };

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
    if (!selectedServer.value) return;

    try {
      const response = await axios.get(`https://universalis.app/api/v2/tax-rates?world=${selectedServer.value}`);
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

  // Throttle the fetchMarketTaxRates function to run at most one per minute
  const throttledfetchMarketTaxRates = throttle(fetchMarketTaxRates, 60000);

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

  // Fetch Upload Count Per Day
  const fetchUploadStats = async () => {
    try {
      const response = await axios.get(`https://universalis.app/api/v2/extra/stats/upload-history`);
      
      if (response.data && response.data.uploadCountByDay) {
        const uploadData = response.data.uploadCountByDay;

        // Extract today's uploads
        const todayUploads = uploadData.length > 0 ? uploadData[0] : 0;

        // Calculate total uploads from the last 7 days
        const weekUploads = uploadData.slice(0, 7).reduce((acc, num) => acc + num, 0);
        
        uploadStats.value.today = todayUploads;
        uploadStats.value.week = weekUploads;
      } else {
        console.warn("No upload data found.");
      }
    } catch (error) {
      console.error('Error fetching upload count per day:', error);
    }
  }

  // Throttle the fetchUploadStats to run at most one per minute
  const throttledFetchUploadStats = throttle(fetchUploadStats, 60000); // 60 seconds

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
        axios.get(`https://v2.xivapi.com/api/sheet/Item/${id}?fields=Name,ItemUICategory,Icon`)
      );
      const responses = await Promise.all(itemDetailsPromises);
      return responses.map((response) => {
        const data = response.data;
        
        // Ensure Icon exists and construct correct image URL
        let iconPath = "";
        if (data.fields?.Icon?.path) {
          const urlParts = data.fields.Icon.path.split("/");
          iconPath = `https://xivapi.com/i/${urlParts[2]}/${urlParts[3].replace(".tex", ".png")}`;
        }
        
        return {
          id: data.row_id,
          name: data.fields.Name,
          category: data.fields.ItemUICategory?.fields?.Name || 'Unknown Category',
          image: iconPath,
        };
      });
    } catch (error) {
      console.error('Error fetching item names:', error);
      return [];
    }
  };

  // Fetch least recently updated items
  const fetchLeastUpdatedItems = async () => {
    try {
      const response = await axios.get(`https://universalis.app/api/v2/extra/stats/least-recently-updated?world=${selectedServer.value}&entries=6`);
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
          throttledfetchMarketTaxRates();
          throttledFetchUploadStats();
          loadSavedItems();
          loadRecentlyViewedItems();
        }
      });

      // Event listener for local storage changes
      window.addEventListener('storage', (event) => {
        if (event.key === 'savedItems') {
          loadSavedItems();
        }
      });

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  });

  onUnmounted(async () => {
    try {
      await closeWebSocket();

      // Remove the event listener
      window.removeEventListener('storage', (event) => {
        if (event.key === 'savedItems') {
          loadSavedItems();
        }
      });

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
          <h2 class="text-center mb-4">Item History</h2>

          <!-- Saved Items Section -->
          <div class="saved-items-section">
            <h2 @click="toggleSavedItems">
              Saved Items
              <span class="dropdown-arrow">{{ isSavedItemsOpen ? '▲' : '▼' }}</span>
            </h2>
            <div v-if="isSavedItemsOpen">
              <div v-if="savedItems.length === 0" class="text-center py-4">
                <p class="text-muted">You haven't saved any items yet.</p>
              </div>
              <ul v-else class="list-group saved-items-list">
                <li v-for="item in savedItems" :key="item.id" class="saved-item">
                  <a :href="`/item/${item.id}`" class="saved-item-link">
                    <div class="saved-item-image-container">
                      <img :src="item.image" alt="Item Icon" class="saved-item-image" />
                    </div>
                    <div class="saved-item-details">
                      <div class="saved-item-name">{{ item.name }}</div>
                      <small class="saved-item-category">{{ formatCategory(item.category) }}</small>
                      <small class="saved-item-date">Saved: {{ new Date(item.savedAt).toLocaleDateString() }}</small>
                    </div>
                  </a>
                  <button
                    @click.prevent="removeFromSaved(item.id)"
                    class="remove-saved-item-btn"
                    title="Remove from saved items"
                  >
                    X
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Recently Viewed Items -->
          <div class="recently-viewed-section">
            <h2 @click="toggleRecentlyViewed">
              Recently Viewed
              <span class="dropdown-arrow">{{ isRecentlyViewedOpen ? '▲' : '▼' }}</span>
            </h2>
            <div v-if="isRecentlyViewedOpen">
              <div v-if="recentlyViewedItems.length === 0" class="text-center py-4">
                <p class="text-muted">You haven't viewed any items yet.</p>
              </div>
              <ul v-else class="list-group recently-viewed-list">
                <li v-for="item in recentlyViewedItems" :key="item.id" class="recently-viewed-item">
                  <a :href="`/item/${item.id}`" class="recently-viewed-item-link">
                    <div class="recently-viewed-item-image-container">
                      <img :src="item.image" alt="Item Icon" class="recently-viewed-item-image" />
                    </div>
                    <div class="recently-viewed-item-details">
                      <div class="recently-viewed-item-name">{{ item.name }}</div>
                      <small class="recently-viewed-item-category">{{ formatCategory(item.category) }}</small>
                      <small class="recently-viewed-item-date">Viewed: {{ new Date(item.viewedAt).toLocaleDateString() }}</small>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
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
        <h2 class="text-center mb-4">Least Recently Updated on {{ selectedServer }}</h2>
        <ul class="list-group">
          <li v-for="item in leastUpdatedItems" :key="item.id" class="list-group-item d-flex align-items-center item-container">
            <a :href="`/item/${item.id}`" class="item-link">
              <img :src="item.image" alt="Item Icon" class="item-image me-3" />
            </a>
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

        <!-- Market Tax Card -->
        <div class="market-tax-card">
          <div class="card-body">
            <h3 class="text-center">Current Market Tax Rates On {{ selectedServer }}</h3>
            <div class="tax-icons">
              <div v-for="tax in taxRates" :key="tax.name" class="tax-item">
                <img :src="tax.image" :alt="tax.name" class="tax-image" />
                <span class="tax-percentage">{{ tax.rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Stats Container -->
        <div class="upload-stats-container">
          <div class="upload-box">
            <span class="upload-title">Uploads Today</span>
            <span class="upload-number">{{ uploadStats.today.toLocaleString() }}</span>
          </div>
          <div class="upload-box">
            <span class="upload-title">Uploads This Week</span>
            <span class="upload-number">{{ uploadStats.week.toLocaleString() }}</span>
          </div>
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

  /* Styling For Upload Stats Box */
  .upload-stats-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    margin-top: 10px;
  }
  
  /* Make the title bold */
  .upload-title {
    font-weight: bold;
  }

  /* Center the upload numbers */
  .upload-number {
    display: block;
    text-align: center;
  }

  /* Item History Section Styling */
  .saved-items-section,
  .recently-viewed-section {
    margin-bottom: 20px;
  }

  /* Section Headers with Dropdown Triangles */
  .saved-items-section h2,
  .recently-viewed-section h2 {
    font-size: 1.5rem;
    cursor: pointer;
    user-select: none;
    padding: 10px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dee2e6;
  }

  .dropdown-arrow {
    margin-left: 8px;
    transition: transform 0.3s ease;
  }

  /* Item Lists */
  .saved-items-list,
  .recently-viewed-list {
    padding: 0;
    margin: 0;
  }

  /* Individual Item Styling */
  .saved-item,
  .recently-viewed-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 5px;
    border: 1px solid #eee;
    border-radius: 5px;
    position: relative;
    transition: background-color 0.2s;
  }

  .saved-item:hover,
  .recently-viewed-item:hover {
    background-color: #f8f9fa;
  }

  /* Item Links */
  .saved-item-link,
  .recently-viewed-item-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    flex: 1;
  }

  /* Item Image Container */
  .saved-item-image-container,
  .recently-viewed-item-image-container {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    flex-shrink: 0;
  }

  /* Item Images */
  .saved-item-image,
  .recently-viewed-item-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 4px;
  }

  /* Item Details */
  .saved-item-details,
  .recently-viewed-item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Item Name */
  .saved-item-name,
  .recently-viewed-item-name {
    font-weight: 600;
    color: #007bff;
    margin-bottom: 2px;
    font-size: 0.9rem;
  }

  /* Item Category & Date */
  .saved-item-category,
  .recently-viewed-item-category,
  .saved-item-date,
  .recently-viewed-item-date {
    display: block;
    color: #6c757d;
    font-size: 0.75rem;
    line-height: 1.2;
  }

  /* Remove Button for Saved Items */
  .remove-saved-item-btn {
    background: none;
    border: none;
    color: #dc3545;
    font-weight: bold;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 5px;
    margin-left: 5px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
  }

  .remove-saved-item-btn:hover {
    background-color: #dc3545;
    color: white;
  }

  /* Empty States */
  .saved-items-section .text-muted,
  .recently-viewed-section .text-muted {
    font-style: italic;
    color: #adb5bd;
  }
</style>
