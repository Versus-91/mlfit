<template>
  <div class="container">
    <div class="columns is-multiline" id="app">
      <SidebarComponent @dataframe="setDataframePorp" @selected-features="setSelectedFeatures"></SidebarComponent>
      <MainComponent :dataframe="dataframe" :selectedFeatures="selectedFeatures"></MainComponent>
    </div>
  </div>
</template>

<script>
import SidebarComponent from "./components/sidebar-component.vue";
import MainComponent from "./components/main-component.vue";


export default {
  name: 'App',
  components: {
    SidebarComponent,
    MainComponent,
  },
  data() {
    return {
      dataframe: null,
      selectedFeatures: []
    }
  },
  methods: {
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
