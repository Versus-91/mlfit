<template>
  <div class="container">
    <div class="columns is-multiline" id="app">
      <SidebarComponent @dataframe="setDataframePorp"></SidebarComponent>
      <MainComponent :dataframe="dataframe"></MainComponent>
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
      dataframe: null
    }
  },
  methods: {
    setDataframePorp(e) {
      this.dataframe = e
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
