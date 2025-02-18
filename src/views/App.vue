<script setup>
  import { ref } from 'vue';
  import { RouterLink, RouterView } from 'vue-router';
  import { SITE_NAME } from '../components/settings.js';
  import settingsModal from '../components/settingsModal.vue';

  const showSettings = ref(false);
  const searchQuery = ref(''); // Define searchQuery
  
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };

  const handleSearch = () => {
    console.log('Search Query:', searchQuery.value);
  };
</script>

<template>
  <header class="bg-dark px-4 py-3 d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <RouterLink to="/" class="text-white text-decoration-none fs-4 me-3">{{ SITE_NAME }}</RouterLink>
      <input 
        v-model="searchQuery" 
        @keyup.enter="handleSearch" 
        type="text" 
        placeholder="Search items..." 
        class="form-control me-2 w-50" 
      />
      <button 
        @click="handleSearch" 
        class="btn btn-primary">
        Search
      </button>
    </div>
    <div class="header-buttons">
      <button class="btn btn-primary" @click="toggleSettings">Settings</button>
    </div>
  </header>

  <main class="flex-grow-1">
    <RouterView />
    <settingsModal
      v-if="showSettings"
      @close="toggleSettings"
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
    margin-top: 20px;
  }
</style>