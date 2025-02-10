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
    computed: {
      groupedServers() {
        const regions = {
          "Chaos - Europe": ["Cerberus", "Louisox", "Moogle", "Omega", "Phantom", "Ragnarok", "Sagittarius", "Spriggan"],
          "Light - Europe": ["Alpha", "Lich", "Odin", "Phoenix", "Raiden", "Shiva", "Twintania", "Zodiark"],
          "Aether - North America": ["Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren"],
          "Crystal - North America": ["Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera"],
          "Dynamis - North America": ["Cuchulainn", "Golem", "Halicarnassus", "Kraken", "Maduin", "Marilith", "Rafflesia", "Seraph"],
          "Primal - North America": ["Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"],
          "Materia - Oceania": ["Bismarck", "Ravana", "Sephirot", "Sophia", "Zurvan"],
          "Elemental - Japan": ["Aegis", "Atomos", "Carbuncle", "Garuda", "Gungnir", "Kujata", "Tonberry", "Typhon"],
          "Gaia - Japan": ["Alexander", "Bahamut", "Durandal", "Fenrir", "Ifrit", "Ridill", "Tiamat", "Ultima"],
          "Mana - Japan": ["Anima", "Asura", "Chocobo", "Hades", "Ixion", "Masamune", "Pandaemonium", "Titan"],
          "Meteor - Japan": ["Belias", "Mandragora", "Ramuh", "Shinryu", "Unicorn", "Valefor", "Yojimbo", "Zeromus"],
        };

        let grouped = {};
        for (const [region, serverList] of Object.entries(regions)) {
          grouped[region] = serverList.filter(server => Object.values(this.servers).includes(server));
        }

        return grouped;
      },
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
    <div class="bruh">
      <header class="modal-header">
        <h2>Settings</h2>
        <button class="close-btn" @click="$emit('close')">X</button>
      </header>
      <div class="modal-body">
        <form>
          <div class="form-group">
            <label for="server">Please Select a Server:</label>
            <select id="server" v-model="settings.server">
              <option value="" disabled>- Please Choose a Server -</option>
              <optgroup v-for="(group, region) in groupedServers" :key="region" :label="region">#
                <option v-for="server in group" :key="server" :value="server">
                  {{ server }}
                </option>
              </optgroup>
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

.bruh {
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
