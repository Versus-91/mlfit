import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.min.css'
import Plotly from 'danfojs/node_modules/plotly.js-dist-min';
import { createPinia, PiniaVuePlugin } from 'pinia'
import VueMathjax from 'vue-mathjax'
Plotly.setPlotConfig({
  autosize: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['resetScale2d', 'zoom2d', 'pan', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '], // Remove certain buttons from the mode bar
});

Vue.config.productionTip = false
Vue.prototype.window = window;

Vue.use(VueMathjax)
Vue.use(Buefy)
Vue.use(PiniaVuePlugin)
const pinia = createPinia()

new Vue({
  render: h => h(App),
  pinia
}).$mount('#app')

