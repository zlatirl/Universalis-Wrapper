<script setup>
  // Import modules and components
  import { ref, watch, onMounted, onUnmounted, provide } from 'vue';
  import { RouterLink, RouterView } from 'vue-router';
  import { SITE_NAME } from '../components/settings.js';
  import settingsModal from '../components/settingsModal.vue';

  // Reactive state variables
  const showSettings = ref(false);
  const selectedServer = ref(null);
  const searchQuery = ref(''); // Define searchQuery
  const show = ref(false)
  const showCategories = ref(false);
  const items = ref([]);
  const activeCategory = ref('');

  // Provide the selected server to child components
  provide('selectedServer', selectedServer);

  // Function to toggle settings modal
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
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
  };

  // Function to handle search query
  const handleSearch = () => {
    console.log('Search Query:', searchQuery.value);
  };

  // Function to toggle categories dropdown
  const toggleCategories = () => {
    showCategories.value = !showCategories.value;
  }

  // Function to handle search results
  const handleShow = (length) => {
    if (length > 0) {
      show.value = true
    } else {
      show.value = false
    }
  }

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
      }
    }
  });

  // Fetch Items By Category
  const fetchCategoryItems = async (categoryName) => {
    showCategories.value = false;
    searchQuery.value = '';

    try {
      const response = await fetch(`https://v2.xivapi.com/api/search?sheets=Item&query=%2BItemSearchCategory.Name%3D%22${categoryName}%22&language=en&limit=100&fields=Name%2CItemSearchCategory.Name%2CIcon`);
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
          <strong>WEAPONS</strong>
          <div class="category-icons">
            <span class="category-icon" @click="fetchCategoryItems('Gladiator\'s Arms')">GLD</span>
            <span class="category-icon" @click="fetchCategoryItems('Marauder\'s Arms')">MRD</span>
            <span class="category-icon" @click="fetchCategoryItems('Dark Knight\'s Arms')">DRK</span>
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

    <!-- Settings Button -->
    <div class="header-buttons">
      <button class="btn btn-primary" @click="toggleSettings">Settings</button>
    </div>
  </header>

  <main class="flex-grow-1">
    <RouterView />
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
    width: 400px;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  /* Removes The Bullet Points From Lists */
  ul {
    list-style-type: none;
  }
</style>
