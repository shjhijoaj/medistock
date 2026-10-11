import axios from 'axios';

export default {
  namespaced: true,
  state: {
    suppliers: JSON.parse(localStorage.getItem('suppliers')) || [],
    lastId: parseInt(localStorage.getItem('lastSupplierId')) || 0
  },
  mutations: {
    ADD_SUPPLIER(state, supplier) {
      const newId = state.lastId + 1;
      state.suppliers.push({
        ...supplier,
        id: newId
      });
      state.lastId = newId;
      
      localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
      localStorage.setItem('lastSupplierId', newId);
    },
    
    UPDATE_SUPPLIER(state, updatedSupplier) {
      const index = state.suppliers.findIndex(s => s.id === updatedSupplier.id);
      if (index !== -1) {
        state.suppliers.splice(index, 1, updatedSupplier);
        localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
      }
    },
    
    DELETE_SUPPLIER(state, id) {
      state.suppliers = state.suppliers.filter(s => s.id !== id);
      localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
    },
    
    SET_SUPPLIERS(state, suppliers) {
      state.suppliers = suppliers;
      localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
    }
  },
  actions: {
    async fetchSuppliers({ commit, state }) {
      // 实际项目中调用API
      // 这里直接使用本地存储数据
      if (state.suppliers.length === 0) {
        // 模拟API调用
        return new Promise(resolve => {
          setTimeout(() => {
            const initialData = [
              { id: 1, name: '药品供应商A', contact: '张经理', phone: '13800138000', address: '北京市朝阳区', remark: '长期合作' },
              { id: 2, name: '医疗用品公司B', contact: '李经理', phone: '13900139000', address: '上海市浦东新区', remark: '主要供应商' }
            ];
            commit('SET_SUPPLIERS', initialData);
            localStorage.setItem('lastSupplierId', 2);
            resolve(initialData);
          }, 500);
        });
      }
      return state.suppliers;
    },
    
    async addSupplier({ commit }, supplier) {
      return new Promise(resolve => {
        setTimeout(() => {
          commit('ADD_SUPPLIER', supplier);
          resolve();
        }, 500);
      });
    },
    
    async updateSupplier({ commit }, supplier) {
      return new Promise(resolve => {
        setTimeout(() => {
          commit('UPDATE_SUPPLIER', supplier);
          resolve();
        }, 500);
      });
    },
    
    async deleteSupplier({ commit }, id) {
      return new Promise(resolve => {
        setTimeout(() => {
          commit('DELETE_SUPPLIER', id);
          resolve();
        }, 500);
      });
    }
  },
  getters: {
    allSuppliers: state => state.suppliers
  }
}