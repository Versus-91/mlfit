<template>
  <div class="container">
    <div class="columns is-multiline" id="app">
      <SidebarComponent @dataframe="setDataframePorp" @selected-features="setSelectedFeatures"></SidebarComponent>
      <MainComponent :dataframe="this.settings.df" :selectedFeatures="selectedFeatures"></MainComponent>
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
    setDataframePorp(e) {
      this.dataframe = e
    },
    setSelectedFeatures(e) {
      this.selectedFeatures = e
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
