// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import VueLocalStorage from 'vue-localstorage'
Vue.use(VueLocalStorage)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
  localStorage: {
    sudoku: {
      type: Array,
      default: []
    },
    sudokuElapsedTime: {
      type: Number,
      default: 0
    },
    xSize: {
      type: Number,
      default: 3
    },
    ySize: {
      type: Number,
      default: 3
    },
    style: {
      type: Number,
      default: 0
    },
    custom: {
      type: Array,
      default: ["😇","🐨","🍎","😍","🦊","🥝","🎈","🐏","😎","💣","🔪","🗡"]
    },
    emptyCells: {
      type: Number,
      default: 40
    }
  }
})
