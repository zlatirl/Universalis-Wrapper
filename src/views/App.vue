<script setup>
  import { RouterLink, RouterView } from 'vue-router';
  import { SITE_NAME } from '../components/settings.js';
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
  </header>

  <main class="flex-grow-1">
    <RouterView />
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