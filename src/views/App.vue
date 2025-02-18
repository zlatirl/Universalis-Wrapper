<script setup>
  import { ref, watch } from 'vue';
  import { RouterLink, RouterView } from 'vue-router';
  import { SITE_NAME } from '../components/settings.js';
  import settingsModal from '../components/settingsModal.vue';

  const showSettings = ref(false);
  const searchQuery = ref(''); // Define searchQuery
  const show = ref(false)
  const items = ref([])
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };

  const handleSearch = () => {
    console.log('Search Query:', searchQuery.value);
  };

  const handleShow = (length) => {
    if (length > 0) {
      show.value = true
    } else {
      show.value = false
    }
  }

  watch(searchQuery, async (newValue, oldValue) => {
    console.log(`search changed from: ${oldValue} to ${newValue}`)
    handleShow(newValue.length)

    const list = await fetchItems(newValue)
    list.forEach(item => {
      let url = item.fields.Icon.path.split("/")
      let finalUrl = `https://xivapi.com/i/${url[2]}/${url[3].slice(0, 6)}.png`
      item.fields.Icon.path = finalUrl
    });
    items.value = list
  })

  const fetchItems = async (itemName) => {
    try {
      const response = await fetch(`https://v2.xivapi.com/api/search?sheets=Item&query=%2BName%7E%22${itemName}%22+%2BItemSearchCategory%3E%3D1&language=en&limit=30&fields=Name%2CItemSearchCategory.Name%2CIcon%2CLevelItem.todo%2CRarity`)
      const data = await response.json();
      console.log(data.results)
      return data.results
    } catch (error) {
      console.error('Error fetching item names:', error);
    }
  };
</script>

<template>
  <header class="bg-dark px-4 py-3 d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <RouterLink to="/" class="text-white text-decoration-none fs-4 me-3">{{ SITE_NAME }}</RouterLink>
      <input v-model="searchQuery" @keyup.enter="handleSearch" type="text" placeholder="Search items..."
        class="form-control me-2 w-50" />
      <div v-if="show">
        <div class="searchP">
          <ul>
            <li v-for="item in items">
              <a :href="`/item/${item.row_id}`" class="text-white text-decoration-none fs-4 me-3">
                <img :src="item.fields.Icon.path" alt="">
                {{
                  item.fields.Name
                }}
              </a>
            </li>
          </ul>
        </div>

      </div>
    </div>
    <div class="header-buttons">
      <button class="btn btn-primary" @click="toggleSettings">Settings</button>
    </div>
  </header>

  <main class="flex-grow-1">
    <RouterView />
    <settingsModal v-if="showSettings" @close="toggleSettings" />
  </main>
</template>

<style scoped>
  header {
    background-color: #343a40;
    padding: 16px;
    color: white;
  }

  main {
    margin-top: 20px;
  }

  .searchP {
    position: absolute;
    left: 150px;
    top: 60px;
    z-index: 999;
    display: flex;
    background-color: #343a40;
    width: auto;
    height: 500px;
    overflow: scroll;
  }

  ul {
    list-style-type: none;
  }
</style>
