import Vue from 'vue'
import Vuex from 'vuex'
import medicine from './modules/medicine'
import supplier from './modules/supplier'
import backup from './modules/backup'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    medicine,
    supplier,
    backup
  },
  strict: process.env.NODE_ENV !== 'production'
})