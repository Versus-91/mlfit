<template>

    <div class="container">
      <div class="columns is-multiline" id="app">

        <SidebarComponent @updateFeatures="updateFeatureStats" @selected-features="setSelectedFeatures">
        </SidebarComponent>
        <MainComponent ref="main" :dataframe="this.settings.df" :selectedFeatures="selectedFeatures"></MainComponent>
      </div>
    </div>

</template>

<script>
import SidebarComponent from "./components/sidebar-component.vue";
import MainComponent from "./components/main-component.vue";
import { settingStore } from '@/stores/settings'


export default {
  name: 'App',
  components: {
    SidebarComponent,
    MainComponent,
  },
  setup() {
    const settings = settingStore()
    return { settings }
  },
  data() {
    return {
      dataframe: null,
      selectedFeatures: []
    }
  },
  methods: {
    reset() {
      this.settings.resetDF();
    },
    updateFeatureStats() {
      this.$refs.main.renderStats();
    },
    setSelectedFeatures(e) {
      this.selectedFeatures = e
    }
  }
}
</script>

<style>
#app {
  font-family: sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 30px;
}
</style>
