<template>
  <div class="medicine-list">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-notebook-2"></i> 药品列表
      </h2>
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索药品名称、规格、批号或供应商"
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <i slot="prefix" class="el-icon-search"></i>
        </el-input>
        <el-button 
          type="primary" 
          icon="el-icon-refresh"
          class="refresh-btn"
          @click="refreshData"
        >
          刷新数据
        </el-button>
      </div>
    </div>
    
    <el-tabs v-model="activeTab" @tab-click="changeFilter">
      <el-tab-pane label="全部药品" name="all"></el-tab-pane>
      <el-tab-pane label="库存不足" name="low"></el-tab-pane>
      <el-tab-pane label="即将过期" name="expiring"></el-tab-pane>
      <el-tab-pane label="已过期" name="expired"></el-tab-pane>
    </el-tabs>
    
    <div class="results-info">
      共找到 <strong>{{ filteredMedicines.length }}</strong> 个药品
    </div>
    
    <el-table 
      :data="filteredMedicines" 
      border 
      stripe 
      v-loading="loading"
      style="width: 100%;"
      class="medicine-table"
    >
      <el-table-column label="ID" prop="id" width="70" align="center" />
      <el-table-column label="药品名称" prop="name" min-width="180" sortable>
        <template slot-scope="scope">
          <span class="medicine-name">
            {{ scope.row.name }}
            <span class="medicine-spec">{{ scope.row.spec }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="批号" prop="batch" width="120" sortable />
      
      <!-- 增强有效期显示 -->
      <el-table-column label="有效期" width="150" sortable>
        <template slot-scope="scope">
          <div class="expiry-cell">
            <div :class="['expiry-date', getExpiryStatus(scope.row.expiryDate).class]">
              {{ formatExpiryDate(scope.row.expiryDate) || '未设置' }}
            </div>
            <div class="expiry-status" v-if="scope.row.expiryDate">
              {{ getExpiryStatus(scope.row.expiryDate).text }}
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="库存状态" width="130" align="center">
        <template slot-scope="scope">
          <div class="stock-indicator">
            <el-progress 
              :percentage="calculateStockPercentage(scope.row)" 
              :color="getStockColor(scope.row)" 
              :show-text="false"
              :stroke-width="6"
            ></el-progress>
            <div class="stock-info">
              <span class="current-stock">{{ scope.row.stock }}</span>
              <span>/</span>
              <span class="min-stock">{{ scope.row.minStock }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="仓库位置" prop="location" width="120" />
      
      <el-table-column label="供应商" prop="supplier" min-width="180">
        <template slot-scope="scope">
          <el-tag 
            type="info"
            size="small"
            class="supplier-tag"
            @click="searchBySupplier(scope.row.supplier)"
          >
            {{ scope.row.supplier || '未知' }}
            <i class="el-icon-s-shop"></i>
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="statistics">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-header">药品统计</div>
        <div class="stat-items">
          <div class="stat-item">
            <i class="el-icon-box"></i>
            <div>
              <div class="stat-label">药品总数</div>
              <div class="stat-value">{{ medicines.length }}</div>
            </div>
          </div>
          <div class="stat-item">
            <i class="el-icon-warning-outline" style="color: #e6a23c;"></i>
            <div>
              <div class="stat-label">库存不足</div>
              <div class="stat-value">{{ lowStockCount }}</div>
            </div>
          </div>
          <div class="stat-item">
            <i class="el-icon-time" style="color: #f56c6c;"></i>
            <div>
              <div class="stat-label">即将过期</div>
              <div class="stat-value">{{ expiringCount }}</div>
            </div>
          </div>
          <div class="stat-item">
            <i class="el-icon-delete" style="color: #f56c6c;"></i>
            <div>
              <div class="stat-label">已过期</div>
              <div class="stat-value">{{ expiredCount }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import dayjs from 'dayjs';

export default {
  name: 'MedicineList',
  data() {
    return {
      loading: false,
      searchQuery: '',
      activeTab: 'all',
      filteredMedicines: []
    };
  },
  computed: {
    ...mapGetters('medicine', [
      'allMedicines', 
      'lowStockMedicines',
      'expiringMedicines',
      'expiredMedicines'  // 确保您的Vuex getter中包含expiredMedicines
    ]),
    
    medicines() {
      return this.allMedicines || [];
    },
    
    lowStockCount() {
      return this.lowStockMedicines?.length || 0;
    },
    
    expiringCount() {
      return this.expiringMedicines?.length || 0;
    },
    
    expiredCount() {
      return this.expiredMedicines?.length || 0;
    }
  },
  watch: {
    medicines: {
      immediate: true,
      handler() {
        this.filterMedicines();
      }
    }
  },
  methods: {
    ...mapActions('medicine', ['fetchMedicines']),
    
    // 增强有效期状态判断
    getExpiryStatus(expiryDate) {
      if (!expiryDate) return { 
        class: 'no-expiry', 
        text: '未设置有效期' 
      };
      
      const days = dayjs(expiryDate).diff(dayjs(), 'day');
      
      if (days < 0) {
        return { 
          class: 'expired', 
          text: `已过期 ${Math.abs(days)} 天`
        };
      } else if (days < 30) {
        return { 
          class: 'expiring', 
          text: `还有 ${days} 天过期`
        };
      }
      
      return { 
        class: 'valid', 
        text: `有效期充足 (${days}天)` 
      };
    },
    
    // 格式化有效期显示
    formatExpiryDate(dateString) {
      if (!dateString) return null;
      return dayjs(dateString).format('YYYY-MM-DD');
    },
    
    calculateStockPercentage(medicine) {
      if (!medicine.minStock || medicine.minStock === 0) return 100;
      const percentage = (medicine.stock / medicine.minStock) * 100;
      return Math.min(100, Math.max(0, percentage));
    },
    
    getStockColor(medicine) {
      const percentage = this.calculateStockPercentage(medicine);
      
      if (percentage < 30) return '#f56c6c'; // 红色
      if (percentage < 70) return '#e6a23c'; // 黄色
      return '#67c23a'; // 绿色
    },
    
    filterMedicines() {
      const query = this.searchQuery.toLowerCase().trim();
      const tabFilter = this.activeTab;
      
      this.filteredMedicines = this.medicines.filter(medicine => {
        // 按标签筛选
        if (tabFilter === 'low' && medicine.stock >= medicine.minStock) return false;
        
        if (tabFilter === 'expiring') {
          const status = this.getExpiryStatus(medicine.expiryDate);
          if (!status.class.includes('expiring')) return false;
        }
        
        if (tabFilter === 'expired') {
          const status = this.getExpiryStatus(medicine.expiryDate);
          if (!status.class.includes('expired')) return false;
        }
        
        // 按搜索词筛选
        if (query) {
          const matchesName = medicine.name?.toLowerCase().includes(query);
          const matchesSpec = medicine.spec?.toLowerCase().includes(query);
          const matchesBatch = medicine.batch?.toLowerCase().includes(query);
          const matchesSupplier = medicine.supplier?.toLowerCase().includes(query);
          return matchesName || matchesSpec || matchesBatch || matchesSupplier;
        }
        
        return true;
      });
    },
    
    handleSearch() {
      this.filterMedicines();
    },
    
    changeFilter(tab) {
      this.activeTab = tab.name;
      this.filterMedicines();
    },
    
    searchBySupplier(supplierName) {
      if (supplierName) {
        this.searchQuery = supplierName;
        this.filterMedicines();
      }
    },
    
    async refreshData() {
      try {
        this.loading = true;
        await this.fetchMedicines();
        this.$message.success('药品数据已刷新');
      } catch (error) {
        console.error('刷新数据失败:', error);
        this.$message.error('刷新数据失败');
      } finally {
        this.loading = false;
      }
    }
  },
  async mounted() {
    this.loading = true;
    try {
      await this.fetchMedicines();
    } catch (error) {
      console.error('获取药品数据失败:', error);
      this.$message.error('加载药品数据失败');
    }
    this.loading = false;
  }
}
</script>

<style scoped>
.medicine-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  margin: 0;
}

.page-title i {
  margin-right: 10px;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-input {
  width: 300px;
}

.search-input ::v-deep .el-input__inner {
  border-radius: 20px;
  padding-left: 35px;
  background-color: #f8f8f8;
  border-color: #e6e6e6;
}

.search-input ::v-deep .el-input__prefix {
  left: 10px;
}

.refresh-btn {
  border-radius: 20px;
}

.el-tabs {
  margin: 15px 0 20px;
}

.medicine-table {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.medicine-name {
  font-weight: 600;
}

.medicine-spec {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.stock-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stock-info {
  display: flex;
  margin-top: 5px;
  font-size: 14px;
}

.current-stock {
  font-weight: 600;
}

.min-stock {
  color: #909399;
}

/* 有效期单元格样式 */
.expiry-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 0;
}

.expiry-date {
  font-size: 14px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  text-align: center;
  white-space: nowrap;
}

/* 有效期状态样式 */
.expired {
  background-color: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.expiring {
  background-color: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

.valid {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.no-expiry {
  background-color: #fafafa;
  color: #8c8c8c;
  border: 1px dashed #d9d9d9;
}

.expiry-status {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.supplier-tag {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 12px;
  padding: 0 8px;
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
  border-color: rgba(64, 158, 255, 0.3);
}

.supplier-tag:hover {
  background-color: rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.supplier-tag i {
  margin-left: 4px;
}

.statistics {
  margin-top: 25px;
}

.stat-card {
  border-radius: 10px;
  border: none;
  background: linear-gradient(120deg, #f8f8f8, #f0f9ff);
}

.stat-header {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e6e6e6;
  margin-bottom: 15px;
}

.stat-items {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 180px;
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-item i {
  font-size: 24px;
  color: #409EFF;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.results-info {
  margin: -10px 0 15px;
  color: #666;
  font-size: 14px;
}

/* 添加过期药品统计项样式 */
.stat-item .el-icon-delete {
  color: #ff4d4f;
}
</style>