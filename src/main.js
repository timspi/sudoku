// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import VueLocalStorage from 'vue-localstorage'
Vue.use(VueLocalStorage)

import VueTouch from 'vue-touch'
Vue.use(VueTouch, {name: 'v-touch'})

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
  localStorage: {
    sudoku: {
      type: Object,
      default: {xSize: 3, ySize: 3, field: [], elapsedTime: 0, active: -1}
    },
    settings: {
      type: Object,
      default: {style: 0, difficulty: 50}
    },
    custom: {
      type: String,
      default: "🚗,🚕,🚙,🚌,🚜,🚛,🚲,🛵,🏍"
    }
  }
})
