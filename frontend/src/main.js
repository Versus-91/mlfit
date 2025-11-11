import { createApp } from 'vue'
import App from './App.vue'
import Buefy from 'buefy'
import 'buefy/dist/buefy.min.css'

import { createPinia } from 'pinia'

// Vue.prototype.window = window;

// Vue.use(VueMathjax)
// Vue.use(Buefy)
// Vue.use(PiniaVuePlugin)
const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(Buefy)
app.mount('#app');

