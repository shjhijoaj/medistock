export default {
  namespaced: true,
  state: {
    summary: {
      drugCount: 0,
      supplierCount: 0,
      lowStockCount: 0,
      expiringCount: 0
    },
    warnings: [],
    recentInbounds: [],
    trendData: {
      inbound: [],
      outbound: []
    }
  },
  mutations: {
    SET_SUMMARY(state, summary) {
      state.summary = summary;
    },
    SET_WARNINGS(state, warnings) {
      state.warnings = warnings;
    },
    SET_RECENT_INBOUNDS(state, recentInbounds) {
      state.recentInbounds = recentInbounds;
    },
    SET_TREND_DATA(state, trendData) {
      state.trendData = trendData;
    }
  },
  actions: {
    async fetchDashboardData({ commit }) {
      try {
        // 从API获取数据（实际项目中需要调用真实API）
        // 这里使用模拟数据
        
        // 模拟API响应延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 仪表盘概览数据
        const summary = {
          drugCount: 142,
          supplierCount: 8,
          lowStockCount: 5,
          expiringCount: 3
        };
        
        // 库存预警药品
        const warnings = [
          { id: 1, name: '阿司匹林肠溶片', spec: '100mg*30片', currentStock: 12, minStock: 50 },
          { id: 2, name: '头孢克肟胶囊', spec: '100mg*20粒', currentStock: 18, minStock: 30 },
          { id: 3, name: '奥美拉唑肠溶胶囊', spec: '20mg*14粒', currentStock: 20, minStock: 40 }
        ];
        
        // 最近入库记录
        const recentInbounds = [
          { id: 1, date: '2023-11-15', medicineName: '阿莫西林胶囊', batch: 'B20231101', quantity: 100, supplier: '国药控股' },
          { id: 2, date: '2023-11-14', medicineName: '布洛芬缓释胶囊', batch: 'B20231102', quantity: 80, supplier: '华润医药' },
          { id: 3, date: '2023-11-13', medicineName: '维生素C片', batch: 'B20231103', quantity: 120, supplier: '上药集团' },
          { id: 4, date: '2023-11-12', medicineName: '二甲双胍片', batch: 'B20231104', quantity: 90, supplier: '国药控股' },
          { id: 5, date: '2023-11-11', medicineName: '连花清瘟胶囊', batch: 'B20231105', quantity: 70, supplier: '华润医药' }
        ];
        
        // 交易趋势数据
        const trendData = {
          inbound: [
            { date: '11-05', quantity: 80 },
            { date: '11-06', quantity: 120 },
            { date: '11-07', quantity: 95 },
            { date: '11-08', quantity: 150 },
            { date: '11-09', quantity: 110 },
            { date: '11-10', quantity: 130 },
            { date: '11-11', quantity: 90 }
          ],
          outbound: [
            { date: '11-05', quantity: 65 },
            { date: '11-06', quantity: 90 },
            { date: '11-07', quantity: 75 },
            { date: '11-08', quantity: 110 },
            { date: '11-09', quantity: 85 },
            { date: '11-10', quantity: 100 },
            { date: '11-11', quantity: 70 }
          ]
        };
        
        // 提交数据到state
        commit('SET_SUMMARY', summary);
        commit('SET_WARNINGS', warnings);
        commit('SET_RECENT_INBOUNDS', recentInbounds);
        commit('SET_TREND_DATA', trendData);
        
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        throw error;
      }
    }
  },
  getters: {
    summary: state => state.summary,
    warnings: state => state.warnings,
    recentInbounds: state => state.recentInbounds,
    trendData: state => state.trendData
  }
};