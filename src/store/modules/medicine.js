import dayjs from 'dayjs';

export default {
  namespaced: true,
  state: {
    medicines: JSON.parse(localStorage.getItem('medicines')) || [],
    suppliers: JSON.parse(localStorage.getItem('suppliers')) || [
      { id: 1, name: '国药控股', contact: '张经理', phone: '13800138000' },
      { id: 2, name: '华润医药', contact: '李经理', phone: '13900139000' }
    ],
    inboundRecords: JSON.parse(localStorage.getItem('inboundRecords')) || [],
    outboundRecords: JSON.parse(localStorage.getItem('outboundRecords')) || [],
    backupHistories: JSON.parse(localStorage.getItem('backupHistories')) || [], // 新增备份历史
    lastMedicineId: parseInt(localStorage.getItem('lastMedicineId')) || 0,
    lastRecordId: parseInt(localStorage.getItem('lastRecordId')) || 0,
    lastSupplierId: parseInt(localStorage.getItem('lastSupplierId')) || 2
  },
  mutations: {
    ADD_MEDICINE(state, medicine) {
      const newId = ++state.lastMedicineId;
      const newMedicine = {
        ...medicine,
        id: newId,
        stock: 0
      };
      state.medicines.push(newMedicine);
      localStorage.setItem('medicines', JSON.stringify(state.medicines));
      localStorage.setItem('lastMedicineId', newId);
    },
    
    ADD_SUPPLIER(state, supplier) {
      const newId = ++state.lastSupplierId;
      state.suppliers.push({ ...supplier, id: newId });
      localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
      localStorage.setItem('lastSupplierId', newId);
    },
    
    ADD_INBOUND_RECORD(state, record) {
      const newId = ++state.lastRecordId;
      
      // 查找或创建药品
      let medicine = state.medicines.find(m => m.name === record.medicineName);
      if (!medicine) {
        const newMedicine = {
          id: ++state.lastMedicineId,
          name: record.medicineName,
          spec: record.spec || '',
          batch: record.batch,
          stock: record.quantity,
          minStock: 10,
          expiryDate: '',
          location: record.location,
          supplier: record.supplier
        };
        state.medicines.push(newMedicine);
        medicine = newMedicine;
      } else {
        // 更新药品库存
        medicine.stock += record.quantity;
        medicine.batch = record.batch || medicine.batch;
        medicine.supplier = record.supplier || medicine.supplier;
        medicine.location = record.location || medicine.location;
      }
      
      // 查找或创建供应商
      let supplierExists = state.suppliers.some(s => s.name === record.supplier);
      if (record.supplier && !supplierExists) {
        state.suppliers.push({
          id: ++state.lastSupplierId,
          name: record.supplier,
          contact: '',
          phone: ''
        });
      }
      
      // 添加入库记录
      const newRecord = {
        ...record,
        id: newId,
        date: record.date || dayjs().format('YYYY-MM-DD'),
        time: record.time || dayjs().format('HH:mm')
      };
      
      state.inboundRecords.unshift(newRecord);
      
      // 更新存储
      localStorage.setItem('medicines', JSON.stringify(state.medicines));
      localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
      localStorage.setItem('inboundRecords', JSON.stringify(state.inboundRecords));
      localStorage.setItem('lastMedicineId', state.lastMedicineId);
      localStorage.setItem('lastRecordId', state.lastRecordId);
      localStorage.setItem('lastSupplierId', state.lastSupplierId);
    },
    
    ADD_OUTBOUND_RECORD(state, record) {
      const newId = ++state.lastRecordId;
      
      // 查找药品
      const medicine = state.medicines.find(m => m.name === record.medicineName);
      if (medicine) {
        // 更新药品库存
        medicine.stock = Math.max(0, medicine.stock - record.quantity);
      }
      
      // 添加出库记录
      const newRecord = {
        ...record,
        id: newId,
        date: record.date || dayjs().format('YYYY-MM-DD'),
        time: record.time || dayjs().format('HH:mm')
      };
      
      state.outboundRecords.unshift(newRecord);
      
      // 更新存储
      localStorage.setItem('medicines', JSON.stringify(state.medicines));
      localStorage.setItem('outboundRecords', JSON.stringify(state.outboundRecords));
      localStorage.setItem('lastRecordId', state.lastRecordId);
    },
    
    // 新增备份相关功能
    CREATE_BACKUP(state) {
      const backupData = {
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        data: {
          medicines: [...state.medicines],
          suppliers: [...state.suppliers],
          inboundRecords: [...state.inboundRecords],
          outboundRecords: [...state.outboundRecords],
          lastMedicineId: state.lastMedicineId,
          lastRecordId: state.lastRecordId,
          lastSupplierId: state.lastSupplierId
        }
      };
      
      state.backupHistories.unshift(backupData);
      
      // 保存备份历史
      localStorage.setItem('backupHistories', JSON.stringify(state.backupHistories));
      localStorage.setItem('lastBackup', dayjs().format('YYYY-MM-DD HH:mm:ss'));
    },
    
    RESTORE_DATA(state, backupData) {
      state.medicines = [...backupData.medicines];
      state.suppliers = [...backupData.suppliers];
      state.inboundRecords = [...backupData.inboundRecords];
      state.outboundRecords = [...backupData.outboundRecords];
      state.lastMedicineId = backupData.lastMedicineId;
      state.lastRecordId = backupData.lastRecordId;
      state.lastSupplierId = backupData.lastSupplierId;
      
      // 更新localStorage
      localStorage.setItem('medicines', JSON.stringify(state.medicines));
      localStorage.setItem('suppliers', JSON.stringify(state.suppliers));
      localStorage.setItem('inboundRecords', JSON.stringify(state.inboundRecords));
      localStorage.setItem('outboundRecords', JSON.stringify(state.outboundRecords));
      localStorage.setItem('lastMedicineId', state.lastMedicineId);
      localStorage.setItem('lastRecordId', state.lastRecordId);
      localStorage.setItem('lastSupplierId', state.lastSupplierId);
      
      // 标记最后恢复时间
      localStorage.setItem('lastRestore', dayjs().format('YYYY-MM-DD HH:mm:ss'));
    },
    
    DELETE_BACKUP(state, timestamp) {
      state.backupHistories = state.backupHistories.filter(
        b => b.timestamp !== timestamp
      );
      localStorage.setItem('backupHistories', JSON.stringify(state.backupHistories));
    },
    
    EXPORT_BACKUP(state, timestamp) {
      const backup = state.backupHistories.find(b => b.timestamp === timestamp);
      if (backup) {
        const dataStr = JSON.stringify(backup.data);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        
        const exportFileDefaultName = `药品数据备份_${timestamp.replace(/:/g, '-')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    },
    
    IMPORT_BACKUP(state, backupData) {
      const backup = {
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        data: backupData
      };
      
      state.backupHistories.unshift(backup);
      localStorage.setItem('backupHistories', JSON.stringify(state.backupHistories));
    }
  },
  actions: {
    fetchMedicines({ state }) {
      return new Promise((resolve) => {
        // 确保有初始数据
        if (state.medicines.length === 0) {
          state.medicines = [
            { 
              id: 1, 
              name: '阿司匹林', 
              spec: '100mg*30片', 
              batch: 'B20231101', 
              stock: 150, 
              minStock: 50,
              productionDate: '2023-11-01',
              expiryDate: '2025-11-01',
              location: 'A区-1排-3层',
              supplier: '药品供应商A'
            }
          ];
          localStorage.setItem('medicines', JSON.stringify(state.medicines));
          state.lastMedicineId = 1;
        }
        resolve(state.medicines);
      });
    },
    
    fetchSuppliers({ state }) {
      return new Promise((resolve) => {
        resolve(state.suppliers);
      });
    },
    
    fetchInboundRecords({ state }) {
      return new Promise((resolve) => {
        resolve(state.inboundRecords);
      });
    },
    
    fetchOutboundRecords({ state }) {
      return new Promise((resolve) => {
        resolve(state.outboundRecords);
      });
    },
    
    // 新增备份相关actions
    fetchBackupHistories({ state }) {
      return new Promise((resolve) => {
        resolve(state.backupHistories);
      });
    },
    
    addMedicine({ commit }, medicine) {
      commit('ADD_MEDICINE', medicine);
    },
    
    addSupplier({ commit }, supplier) {
      commit('ADD_SUPPLIER', supplier);
    },
    
    inboundMedicine({ commit }, record) {
      commit('ADD_INBOUND_RECORD', record);
    },
    
    outboundMedicine({ commit }, record) {
      commit('ADD_OUTBOUND_RECORD', record);
    },
    
    createBackup({ commit }) {
      commit('CREATE_BACKUP');
    },
    
    restoreData({ commit }, backupData) {
      commit('RESTORE_DATA', backupData);
    },
    
    deleteBackup({ commit }, timestamp) {
      commit('DELETE_BACKUP', timestamp);
    },
    
    exportBackup({ commit }, timestamp) {
      commit('EXPORT_BACKUP', timestamp);
    },
    
    importBackup({ commit }, backupData) {
      commit('IMPORT_BACKUP', backupData);
    }
  },
  getters: {
    allMedicines: state => state.medicines,
    allSuppliers: state => state.suppliers,
    inboundRecords: state => state.inboundRecords,
    outboundRecords: state => state.outboundRecords,
    backupHistories: state => state.backupHistories,
    lastBackupTime: () => {
      const lastBackup = localStorage.getItem('lastBackup');
      return lastBackup ? dayjs(lastBackup).format('YYYY-MM-DD HH:mm:ss') : '暂无备份';
    },
    lastRestoreTime: () => {
      const lastRestore = localStorage.getItem('lastRestore');
      return lastRestore ? dayjs(lastRestore).format('YYYY-MM-DD HH:mm:ss') : '从未恢复';
    },
    dataStatistics: state => ({
      medicineCount: state.medicines.length,
      supplierCount: state.suppliers.length,
      inboundCount: state.inboundRecords.length,
      outboundCount: state.outboundRecords.length
    }),
    lowStockMedicines: state => state.medicines.filter(m => m.stock < m.minStock),
    expiringMedicines: state => state.medicines.filter(m => {
      if (!m.expiryDate) return false;
      return dayjs(m.expiryDate).isBefore(dayjs().add(30, 'day'));
    })
  }
}