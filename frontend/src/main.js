import { createApp } from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import { createPinia } from 'pinia'
import VueMathjax from 'vue-mathjax'
Plotly.setPlotConfig({
  autosize: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['resetScale2d', 'zoom2d', 'pan', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '], // Remove certain buttons from the mode bar
});

const vue = createApp(App)
const pinia = createPinia()

vue.use(VueMathjax)
vue.use(Buefy)
vue.use(pinia)
vue.mount('#app')

