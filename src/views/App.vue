<script setup>
  // Import modules and components
  import { ref, watch, onMounted, onUnmounted, provide } from 'vue';
  import { RouterLink, RouterView } from 'vue-router';
  import { SITE_NAME } from '../components/settings.js';
  import settingsModal from '../components/settingsModal.vue';
  import Notification from '../components/Notification.vue';
  import { useNotificationStore } from '../stores/notification';
  import { useMarketWatcher } from '../services/marketWatcher.js';
  import NotificationDropdown from '../components/NotificationDropdown.vue';

  // Reactive state variables
  const showSettings = ref(false);
  const selectedServer = ref(null);
  const searchQuery = ref(''); // Define searchQuery
  const show = ref(false);
  const showCategories = ref(false);
  const items = ref([]);
  const activeCategory = ref('');
  const showNotifications = ref(false);

  const { startMarketWatcher } = useMarketWatcher();

  // Provide the selected server and notification store to child components
  provide('selectedServer', selectedServer);
  provide('notificationStore', useNotificationStore());

  // Function to toggle settings modal
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };

  // Function to toggle notification dropdown
  const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value;
  };

  // Save the selected server to localStorage
  const handleSaveSettings = (server) => {
    selectedServer.value = server;
    localStorage.setItem('selectedServer', server); // Save to localStorage
    localStorage.setItem('hasSelectedServer', 'true');
    console.log('Selected Server:', selectedServer.value);
    window.location.reload(); // Refresh the page to apply changes
  };

  // Function to close search when clicking outside
  const closeSearch = (event) => {
    const searchContainer = document.querySelector(".searchP");
    const searchInput = document.querySelector(".form-control");
    const categoryDropdown = document.querySelector(".category-dropdown");
    const categoryButton = document.querySelector(".btn-secondary");
    const notificationDropdown = document.querySelector(".notification-dropdown");
    const notificationButton = document.querySelector(".notification-button");
    
    // If the click is NOT inside the search results or search input, hide the dropdown
    if (
      searchContainer && !searchContainer.contains(event.target) &&
      searchInput && !searchInput.contains(event.target)
    ) {
      show.value = false;
      activeCategory.value = '';
    }
    
    // If clicking outside categories, hide category dropdown
    if (
      categoryDropdown && !categoryDropdown.contains(event.target) &&
      categoryButton && !categoryButton.contains(event.target)
    ) {
      showCategories.value = false;
    }

    // If clicking outside notifications, hide notification dropdown
    if (
      notificationDropdown && !notificationDropdown.contains(event.target) &&
      notificationButton && !notificationButton.contains(event.target)
    ) {
      showNotifications.value = false;
    }
  };

  // Function to handle search query
  const handleSearch = () => {
    console.log('Search Query:', searchQuery.value);
  };

  // Function to toggle categories dropdown
  const toggleCategories = () => {
    showCategories.value = !showCategories.value;
  };

  // Function to handle search results
  const handleShow = (length) => {
    if (length > 0) {
      show.value = true;
    } else {
      show.value = false;
    }
  };

  const fetchItems = async (itemName) => {
    try {
      const response = await fetch(`https://v2.xivapi.com/api/search?sheets=Item&query=%2BName%7E%22${itemName}%22+%2BItemSearchCategory%3E%3D1&language=en&limit=30&fields=Name%2CItemSearchCategory.Name%2CIcon%2CLevelItem.todo%2CRarity`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching item names:', error);
      return [];
    }
  };
  
  // Watch for changes in the search input and update results dynamically
  watch(searchQuery, async (newValue) => {
    if (newValue) {
      console.log(`search changed to: ${newValue}`);
      activeCategory.value = '';
      handleShow(newValue.length);

      const list = await fetchItems(newValue);
      if (Array.isArray(list)) {
        list.forEach(item => {
          const urlParts = item.fields.Icon.path.split("/");
          item.fields.Icon.path = `https://xivapi.com/i/${urlParts[2]}/${urlParts[3].slice(0, 6)}.png`;
        });
        items.value = list;
      } else {
        items.value = [];
        show.value = false;
      }
    } else {
      // Clear the search results when the search query is empty
      items.value = [];
      show.value = false;
    }
  });

  // Fetch Items By Category
  const fetchCategoryItems = async (categoryName) => {
    showCategories.value = false;
    searchQuery.value = '';

    try {
      const response = await fetch(`https://v2.xivapi.com/api/search?sheets=Item&query=%2BItemSearchCategory.Name%3D%22${categoryName}%22&language=en&limit=500&fields=Name%2CItemSearchCategory.Name%2CIcon`);
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        processItems(data.results);
        activeCategory.value = categoryName;
        show.value = true;
      } else {
        items.value = [];
      }
    } catch (error) {
      console.error('Error fetching category items:', error);
      items.value = [];
    }
  };

  // Function to process fetched items
  const processItems = (list) => {
    if (!Array.isArray(list)) {
      items.value = [];
      return;
    }
    list.forEach((item) => {
      const urlParts = item.fields.Icon.path.split('/');
      item.fields.Icon.path = `https://xivapi.com/i/${urlParts[2]}/${urlParts[3].slice(0, 6)}.png`;
    });
    items.value = list;
    show.value = true;
  };

  // Attach and detach the event listener
  onMounted(() => {
    const savedServer = localStorage.getItem('selectedServer');
    if (savedServer) {
      selectedServer.value = savedServer;
    }
    
    const hasSelectedServer = localStorage.getItem('hasSelectedServer');
    if (!hasSelectedServer) {
      showSettings.value = true;
    }
    
    startMarketWatcher();
    document.addEventListener("click", closeSearch);
  });
  
  onUnmounted(() => {
    document.removeEventListener("click", closeSearch);
  });
</script>

<template>
  <header class="bg-dark px-4 py-3 d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <RouterLink to="/" class="text-white text-decoration-none fs-4 me-3">{{ SITE_NAME }}</RouterLink>

      <!-- Search bar -->
      <input 
        v-model="searchQuery" 
        @keyup.enter="handleSearch" 
        type="text" 
        placeholder="Search items..."
        class="form-control" 
      />

      <!-- Categories -->
      <button class="btn btn-secondary ms-2" @click="toggleCategories">Categories</button>

      <!-- Categories Dropdown -->
      <div v-if="showCategories" class="category-dropdown">
        <div class="category-section">
          <!-- Weapons Section -->
          <strong>WEAPONS</strong>
          <div class="category-icons">
            <span class="category-icon" @click="fetchCategoryItems('Gladiator\'s Arms')">GLD</span>
            <span class="category-icon" @click="fetchCategoryItems('Marauder\'s Arms')">MRD</span>
            <span class="category-icon" @click="fetchCategoryItems('Dark Knight\'s Arms')">DRK</span>
            <span class="category-icon" @click="fetchCategoryItems('Gunbreaker\'s Arms')">GNB</span>
            <span class="category-icon" @click="fetchCategoryItems('Lancer\'s Arms')">LNC</span>
            <span class="category-icon" @click="fetchCategoryItems('Reaper\'s Arms')">RPR</span>
            <span class="category-icon" @click="fetchCategoryItems('Pugilist\'s Arms')">PGL</span>
            <span class="category-icon" @click="fetchCategoryItems('Samurai\'s Arms')">SAM</span>
            <span class="category-icon" @click="fetchCategoryItems('Rogue\'s Arms')">ROG</span>
            <span class="category-icon" @click="fetchCategoryItems('Viper\'s Arms')">VPR</span>
            <span class="category-icon" @click="fetchCategoryItems('Archer\'s Arms')">ARC</span>
            <span class="category-icon" @click="fetchCategoryItems('Machinist\'s Arms')">MCH</span>
            <span class="category-icon" @click="fetchCategoryItems('Dancer\'s Arms')">DNC</span>
            <span class="category-icon" @click="fetchCategoryItems('Thaumaturge\'s Arms')">THM</span>
            <span class="category-icon" @click="fetchCategoryItems('Arcanist\'s Arms')">ACN</span>
            <span class="category-icon" @click="fetchCategoryItems('Red Mage\'s Arms')">RDM</span>
            <span class="category-icon" @click="fetchCategoryItems('Conjurer\'s Arms')">CNJ</span>
            <span class="category-icon" @click="fetchCategoryItems('Scholar\'s Arms')">SCH</span>
            <span class="category-icon" @click="fetchCategoryItems('Astrologian\'s Arms')">AST</span>
            <span class="category-icon" @click="fetchCategoryItems('Sage\'s Arms')">SGE</span>
            <span class="category-icon" @click="fetchCategoryItems('Carpenter\'s Tools')">CRP</span>
            <span class="category-icon" @click="fetchCategoryItems('Blacksmith\'s Tools')">BSM</span>
            <span class="category-icon" @click="fetchCategoryItems('Armorer\'s Tools')">ARM</span>
            <span class="category-icon" @click="fetchCategoryItems('Goldsmith\'s Tools')">GSM</span>
            <span class="category-icon" @click="fetchCategoryItems('Leatherworker\'s Tools')">LTW</span>
            <span class="category-icon" @click="fetchCategoryItems('Weaver\'s Tools')">WVR</span>
            <span class="category-icon" @click="fetchCategoryItems('Alchemist\'s Tools')">ALC</span>
            <span class="category-icon" @click="fetchCategoryItems('Culinarian\'s Tools')">CUL</span>
            <span class="category-icon" @click="fetchCategoryItems('Miner\'s Tools')">MIN</span>
            <span class="category-icon" @click="fetchCategoryItems('Botanist\'s Tools')">BTN</span>
            <span class="category-icon" @click="fetchCategoryItems('Fisher\'s Tools')">FSH</span>
            <span class="category-icon" @click="fetchCategoryItems('Fishing Tackle')">Tools</span>
          </div>
        </div>

        <!-- Armor Section -->
        <div class="category-section">
          <strong>ARMOR</strong>
          <div class="category-icons">
            <span class="category-icon" @click="fetchCategoryItems('Head')">Head</span>
            <span class="category-icon" @click="fetchCategoryItems('Body')">Body</span>
            <span class="category-icon" @click="fetchCategoryItems('Hands')">Hands</span>
            <span class="category-icon" @click="fetchCategoryItems('Legs')">Legs</span>
            <span class="category-icon" @click="fetchCategoryItems('Feet')">Feet</span>
            <span class="category-icon" @click="fetchCategoryItems('Waist')">Waist</span>
            <span class="category-icon" @click="fetchCategoryItems('Necklace')">Neck</span>
            <span class="category-icon" @click="fetchCategoryItems('Earrings')">Ears</span>
            <span class="category-icon" @click="fetchCategoryItems('Bracelets')">Bracelets</span>
            <span class="category-icon" @click="fetchCategoryItems('Ring')">Rings</span>
          </div>
        </div>

        <!-- Item Section -->
        <div class="category-section">
          <strong>ITEMS</strong>
          <div class="category-icons">
            <span class="category-icon" @click="fetchCategoryItems('Medicine')">Medicine</span>
            <span class="category-icon" @click="fetchCategoryItems('Ingredients')">Ingredients</span>
            <span class="category-icon" @click="fetchCategoryItems('Meals')">Meals</span>
            <span class="category-icon" @click="fetchCategoryItems('Seafood')">Seafood</span>
            <span class="category-icon" @click="fetchCategoryItems('Stone')">Stone</span>
            <span class="category-icon" @click="fetchCategoryItems('Metal')">Metal</span>
            <span class="category-icon" @click="fetchCategoryItems('Lumber')">Lumber</span>
            <span class="category-icon" @click="fetchCategoryItems('Cloth')">Cloth</span>
            <span class="category-icon" @click="fetchCategoryItems('Leather')">Leather</span>
            <span class="category-icon" @click="fetchCategoryItems('Bone')">Bone</span>
            <span class="category-icon" @click="fetchCategoryItems('Reagent')">Reagent</span>
            <span class="category-icon" @click="fetchCategoryItems('Dyes')">Dyes</span>
            <span class="category-icon" @click="fetchCategoryItems('Weapon Parts')">Wpn Parts</span>
            <span class="category-icon" @click="fetchCategoryItems('Materia')">Materia</span>
            <span class="category-icon" @click="fetchCategoryItems('Crystal')">Crystal</span>
            <span class="category-icon" @click="fetchCategoryItems('Catalysts')">Catalysts</span>
            <span class="category-icon" @click="fetchCategoryItems('Miscellany')">Misc</span>
            <span class="category-icon" @click="fetchCategoryItems('Seasonal Miscellany')">Misc 2</span>
            <span class="category-icon" @click="fetchCategoryItems('Registrable Miscellany')">Misc 3</span>
            <span class="category-icon" @click="fetchCategoryItems('Airship/Submersible Components')">Components</span>
            <span class="category-icon" @click="fetchCategoryItems('Orchestrion Components')">Orchestrion</span>
          </div>
        </div>

        <!-- Housing Section -->
        <div class="category-section">
          <strong>HOUSING</strong>
          <div class="category-icons">
            <span class="category-icon" @click="fetchCategoryItems('Exterior Fixtures')">Ext Fixtures</span>
            <span class="category-icon" @click="fetchCategoryItems('Interior Fixtures')">Int Fixtures</span>
            <span class="category-icon" @click="fetchCategoryItems('Outdoor Furnishings')">Out Furnishings</span>
            <span class="category-icon" @click="fetchCategoryItems('Furnishings')">Furnishings</span>
            <span class="category-icon" @click="fetchCategoryItems('Chairs and Beds')">Chairs & Beds</span>
            <span class="category-icon" @click="fetchCategoryItems('Tables')">Tables</span>
            <span class="category-icon" @click="fetchCategoryItems('Tabletop')">Tabletop</span>
            <span class="category-icon" @click="fetchCategoryItems('Wall-mounted')">Wall-mounted</span>
            <span class="category-icon" @click="fetchCategoryItems('Rugs')">Rugs</span>
            <span class="category-icon" @click="fetchCategoryItems('Gardening Items')">Gardening</span>
            <span class="category-icon" @click="fetchCategoryItems('Paintings')">Paintings</span>
          </div>
        </div>
      </div>

      <!-- Search results -->
      <div v-if="show">
        <div class="searchP">
          <div class="search-header">
            <span v-if="searchQuery">
              Found {{ items.length }} / 30 for <strong>{{ searchQuery }}</strong>
            </span>
            <span v-else>
              Found {{ items.length }} items for <strong>{{ activeCategory }}</strong>
            </span>
          </div>
          <ul class="search-results">
            <!-- Looping through search items -->
            <li v-for="item in items" class="search-item">
              <a :href="`/item/${item.row_id}`" class="item-link">
                <div class="item-container">
                  <!-- Display item icon, name, and category -->
                  <img :src="item.fields.Icon.path" alt="">
                  <div class="item-info">
                    <span class="item-name">{{  item.fields.Name }}</span>
                  </div>
                </div>
                <small class="item-category">{{ item.fields.ItemSearchCategory.fields.Name }}</small>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Notification Button and Dropdown -->
    <div class="header-buttons">
      <button class="btn btn-primary notification-button me-2" @click="toggleNotifications">
        Notifications
      </button>
      <NotificationDropdown v-if="showNotifications" />

      <!-- Settings Button -->
      <button class="btn btn-primary" @click="toggleSettings">Settings</button>
    </div>
  </header>

  <main class="flex-grow-1">
    <RouterView />
    <Notification />
    <settingsModal 
      v-if="showSettings" 
      @close="toggleSettings" 
      @save="handleSaveSettings"
      :selectedServer="selectedServer"
    />
  </main>
</template>

<style scoped>
  header {
    background-color: #343a40;
    padding: 16px;
    color: white;
  }

  main {
    margin-top: 10px;
  }

  /* Control Size Of Search Bar */
  .form-control {
    width: 150%;
    max-width: 500px;
  }

  /* Styles For The Search Dropdown Container */
  .searchP {
    position: absolute;
    left: 150px;
    top: 60px;
    z-index: 999;
    background-color: #343a40;
    width: 500px;
    height: 500px;
    overflow-y: scroll;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  /* Search Results Header */
  .search-header {
    background-color: #2a2f36;
    color: white;
    font-size: 14px;
    padding: 10px;
    border-radius: 6px 6px 0 0;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #40474f;
  }

  /* Removes Default List Styling */
  .search-results {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  
  /* Search Result Styles */
  .search-item {
    background-color: #2a2f36;
    padding: 8px;
    margin-bottom: 5px;
    border-radius: 6px;
    transition: background-color 0.2s ease-in-out;
  }

  /* Hover Effect For Search Results */
  .search-item:hover {
    background-color: #40474f;
  }

  /* Search Result Link */
  .item-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: white;
    padding: 5px;
  }

  /* Layout For Each Search Result Item */
  .item-container {
    display: flex;
    align-items: center;
    width: 100%;
    padding-right: 10px;
    gap: 8px;
  }

  /* Item Images */
  .item-icon {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 8px;
  }

  /* Controls The Layout Of The Item Text */
  .item-info {
    display: flex;
    flex-direction: column;
  }

  /* Item Name */
  .item-name {
    font-size: 14px;
    font-weight: bold;
  }

  /* Item Category */
  .item-category {
    font-size: 12px;
    color: #b0b0b0;
    margin-left: auto;
    text-align: right;
    min-width: 80px;
  }

  /* Category Dropdown Container */
  .category-dropdown {
    position: absolute;
    left: 150px;
    top: 60px;
    z-index: 999;
    background-color: #2a2f36;
    width: 500px;
    max-height: 600px;
    overflow-y: auto;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  /* Styles For Each Category Section */
  .category-section {
    margin-bottom: 20px;
  }

  .category-section strong {
    display: block;
    color: #e6c054;
    font-size: 16px;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #40474f;
  }

  /* Grid Container for Category Icons */
  .category-icons {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }

  /* Individual Category Icon */
  .category-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #343a40;
    color: white;
    height: 40px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    text-align: center;
    padding: 4px;
  }

  /* Hover Effect for Category Icons */
  .category-icon:hover {
    background-color: #40474f;
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>
