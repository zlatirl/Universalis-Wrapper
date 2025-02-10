<script>
  import { worlds } from './settings';

  export default {
    name: 'SettingsModal',
    data() {
      return {
        settings: {
          server: '',
          dataCenter: '',
          timezone: '',
        },
        servers: worlds || {},
      };
    },
    methods: {
      saveSettings() {
        console.log('Settings saved:', this.settings);
        this.$emit('close');
      },
    },
  };
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <header class="modal-header">
        <h2>Settings</h2>
        <button class="close-btn" @click="$emit('close')">X</button>
      </header>
      <div class="modal-body">
        <form>
          <div class="form-group">
            <label for="server">Please Select a Server:</label>
            <select id="server" v-model="settings.server">
              <option v-for="(name, id) in servers" :key="id" :value="name">
                {{ name }}
              </option>
            </select>
          </div>
        </form>
      </div>
      <footer class="modal-footer">
        <button class="btn btn-success" @click="saveSettings">Save Settings</button>
      </footer>
    </div>
  </div>
</template>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: #fff;
  border-radius: 10px;
  width: 500px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-body {
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.btn {
  padding: 5px 10px;
  font-size: 16px;
  border-radius: 5px;
}
</style>
