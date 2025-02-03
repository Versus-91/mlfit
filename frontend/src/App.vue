<template>

  <div class="container">
    <b-notification v-show="this.settings.getDatasizeFlag" class="mt-2" type="is-warning" has-icon
      aria-close-label="Close notification" role="alert">
      Due to the large size of dataset only 10,000 radom samples from dataset would be used.
    </b-notification>
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
    // eslint-disable-next-line no-unused-vars
    const settings = settingStore()
    return { settings }
  },
  errorCaptured(err, vm, info) {
    console.log(`cat EC: ${err.toString()}\ninfo: ${info}`);
    this.$buefy.toast.open(
      {
        duration: 3000,
        message: 'Something went wrong',
        type: 'is-danger',
      })
    this.settings.addMessage({message: err.toString(), type: 'warning'})
    return false;
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
