<script setup>
import { ref } from 'vue';

// Get current year for copyright
const currentYear = ref(new Date().getFullYear());
</script>

<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-links">
        <a href="https://docs.universalis.app/" class="footer-link">API Documentation</a>
        <span class="divider">|</span>
        <a href="https://github.com/zlatirl/Universalis-Wrapper" class="footer-link">GitHub</a>
      </div>
      <div class="footer-copyright">
        FINAL FANTASY XIV © 2010 - {{ currentYear }} SQUARE ENIX CO., LTD. All Rights Reserved.
      </div>
      <div class="footer-disclaimer">
        This site uses data from Universalis and is not affiliated with SQUARE ENIX.
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: #343a40;
  color: #adb5bd;
  padding: 1.5rem 0;
  margin-top: 0;
  width: 100%;
  border-top: none;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.footer-link {
  color: #f8f9fa;
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 0.9rem;
}

.footer-link:hover {
  color: #79b8ff;
  text-decoration: underline;
}

.divider {
  color: #6c757d;
}

.footer-copyright {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.footer-disclaimer {
  font-size: 0.75rem;
  color: #6c757d;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .footer-links {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .divider {
    display: none;
  }
}
</style>