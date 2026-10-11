export default {
  namespaced: true,
  actions: {
    async backupData({ rootState }) {
      try {
        const backup = {
          date: new Date().toISOString(),
          medicines: rootState.medicine.medicines,
          suppliers: rootState.supplier.suppliers,
          transactions: rootState.medicine.transactions
        };
        
        // 创建Blob对象
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medsys-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        return true;
      } catch (error) {
        console.error('备份失败:', error);
        throw new Error('数据备份失败');
      }
    },
    
    async restoreData(context, file) {
      try {
        // 读取上传的文件内容
        const data = await this._readFile(file);
        const backup = JSON.parse(data);
        
        // 验证备份数据结构
        if (!backup.medicines || !backup.suppliers) {
          throw new Error('备份文件格式不正确');
        }
        
        // 提交恢复数据的mutation
        context.commit('medicine/SET_MEDICINES', backup.medicines, { root: true });
        context.commit('supplier/SET_SUPPLIERS', backup.suppliers, { root: true });
        
        if (backup.transactions) {
          context.commit('medicine/SET_TRANSACTIONS', backup.transactions, { root: true });
        }
        
        return true;
      } catch (error) {
        console.error('恢复失败:', error);
        throw new Error('数据恢复失败: ' + error.message);
      }
    },
    
    _readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
      });
    }
  },
  
  mutations: {
    // 提供其他模块调用恢复数据的mutation
    RESTORE_MEDICINES(state, medicines) {
      state.medicines = medicines;
      localStorage.setItem('medicines', JSON.stringify(medicines));
    },
    RESTORE_SUPPLIERS(state, suppliers) {
      state.suppliers = suppliers;
      localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }
  }
}