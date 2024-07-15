import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import { tensorflow } from 'danfojs/dist/danfojs-base';
import Plotly from 'plotly.js-dist-min';

Plotly.setPlotConfig({
  displaylogo: false,
  modeBarButtonsToRemove: ['resetScale2d', 'zoom2d', 'pan', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '], // Remove certain buttons from the mode bar
});

import * as sk from 'scikitjs'
import { createPinia, PiniaVuePlugin } from 'pinia'
sk.setBackend(tensorflow)
Vue.config.productionTip = false
Vue.use(Buefy)
Vue.use(PiniaVuePlugin)
const pinia = createPinia()
new Vue({
  render: h => h(App),
  pinia
}).$mount('#app')
