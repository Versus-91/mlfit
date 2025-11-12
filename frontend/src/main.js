import { createApp } from 'vue'
import App from './App.vue'
import buefy from 'buefy'
import { createPinia } from 'pinia'

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(buefy)
app.mount('#app');

