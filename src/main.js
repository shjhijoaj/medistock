import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import './styles.css'
import { request } from './api'
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(ElementUI)
Vue.config.productionTip = false
const sections = ['dashboard', 'inventory', 'medicines', 'suppliers', 'inbound', 'outbound', 'history', 'settings']
const Empty = { render: h => h('span') }
const router = new VueRouter({ mode: 'hash', routes: [{ path: '/', redirect: '/dashboard' }, ...sections.map(s => ({ path: '/' + s, component: Empty })), { path: '*', redirect: '/dashboard' }] })
const store = new Vuex.Store({
  state: { snapshot: { medicines: [], suppliers: [], batches: [], documents: [], stats: {}, trend: [], categories: [] }, ready: false, error: '' },
  mutations: { loaded(state, data) { state.snapshot = data; state.ready = true; state.error = '' }, failed(state, error) { state.error = error } },
  actions: { async refresh({ commit }) { try { commit('loaded', await request('/snapshot')) } catch (e) { commit('failed', e.message); throw e } } }
})
new Vue({ router, store, render: h => h(App) }).$mount('#app')
