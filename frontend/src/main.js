import Vue from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.min.css'

import { createPinia, PiniaVuePlugin } from 'pinia'
import VueMathjax from 'vue-mathjax'

Vue.prototype.window = window;

Vue.use(VueMathjax)
Vue.use(Buefy)
Vue.use(PiniaVuePlugin)
const pinia = createPinia()

new Vue({
  render: h => h(App),
  pinia
}).$mount('#app')

