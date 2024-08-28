import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'
import { tensorflow } from 'danfojs/dist/danfojs-base';
import Plotly from 'plotly.js-dist-min';
import * as sk from 'scikitjs'
import { createPinia, PiniaVuePlugin } from 'pinia'

Plotly.setPlotConfig({
  autosize: true,
  staticPlot: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['resetScale2d', 'zoom2d', 'pan', 'select2d', 'resetViews', 'sendDataToCloud', 'hoverCompareCartesian', 'lasso2d', 'drawopenpath '], // Remove certain buttons from the mode bar
});


sk.setBackend(tensorflow);
Vue.config.productionTip = false
Vue.prototype.window = window;


Vue.use(Buefy)
Vue.use(PiniaVuePlugin)
const pinia = createPinia()
new Vue({
  render: h => h(App),
  pinia
}).$mount('#app')
