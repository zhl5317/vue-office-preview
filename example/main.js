import Vue from 'vue'
import VueOfficePreview from '../src/index.js'
import App from './App.vue'
Vue.use(VueOfficePreview)

new Vue({
  el: '#app',
  render: h => (h)(App)
})
