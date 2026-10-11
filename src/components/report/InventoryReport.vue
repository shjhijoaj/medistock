<template>
  <div class="inventory-report">
    <h2 class="report-title">库存报表</h2>
    
    <div class="filter-container">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="药品名称">
          <el-input 
            v-model="filterForm.name" 
            placeholder="搜索药品名称" 
            clearable
            style="width: 180px;"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="库存状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="充足" value="normal"></el-option>
            <el-option label="不足" value="low"></el-option>
            <el-option label="即将过期" value="expiring"></el-option>
            <el-option label="已过期" value="expired"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="getReport">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <el-card class="report-card">
      <div class="report-actions">
        <el-button type="success" icon="el-icon-download" @click="exportReport">
          导出Excel
        </el-button>
      </div>
      
      <el-table 
        :data="reportData" 
        border 
        stripe 
        v-loading="loading"
        style="width: 100%; margin-top: 15px;"
      >
        <el-table-column label="药品编号" prop="id" width="100" align="center"></el-table-column>
        <el-table-column label="药品名称" prop="name" min-width="200"></el-table-column>
        <el-table-column label="规格" prop="spec" width="120"></el-table-column>
        <el-table-column label="批号" prop="batch" width="150"></el-table-column>
        <el-table-column label="当前库存" prop="stock" width="100" align="right"></el-table-column>
        <el-table-column label="最低库存" prop="minStock" width="100" align="right"></el-table-column>
        <el-table-column label="有效期" prop="expiryDate" width="120"></el-table-column>
        <el-table-column label="库位" prop="location" width="150"></el-table-column>
        <el-table-column label="库存状态" width="120">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row)" size="small">
              {{ getStatusText(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'InventoryReport',
  meta: {
    title: '库存报表'
  },
  data() {
    return {
      loading: false,
      filterForm: {
        name: '',
        status: ''
      },
      reportData: []
    };
  },
  computed: {
    ...mapGetters('medicine', ['allMedicines'])
  },
  mounted() {
    this.getReport();
  },
  methods: {
    getReport() {
      this.loading = true;
      
      // 模拟API调用
      setTimeout(() => {
        this.reportData = this.allMedicines.filter(item => {
          let include = true;
          
          // 药品名称筛选
          if (this.filterForm.name && !item.name.includes(this.filterForm.name)) {
            include = false;
          }
          
          // 状态筛选
          if (this.filterForm.status) {
            const status = this.getInventoryStatus(item);
            if (status !== this.filterForm.status) {
              include = false;
            }
          }
          
          return include;
        });
        
        this.loading = false;
      }, 500);
    },
    
    resetFilter() {
      this.filterForm = {
        name: '',
        status: ''
      };
      this.getReport();
    },
    
    exportReport() {
      this.$message({
        message: '导出报表功能正在开发中',
        type: 'success'
      });
    },
    
    getInventoryStatus(medicine) {
      const today = new Date();
      const expiry = medicine.expiryDate ? new Date(medicine.expiryDate) : null;
      
      if (expiry && expiry < today) {
        return 'expired';
      }
      
      if (medicine.stock < medicine.minStock) {
        return 'low';
      }
      
      if (expiry) {
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          return 'expiring';
        }
      }
      
      return 'normal';
    },
    
    getStatusTagType(item) {
      const status = this.getInventoryStatus(item);
      return {
        expired: 'danger',
        low: 'warning',
        expiring: 'warning',
        normal: 'success'
      }[status] || '';
    },
    
    getStatusText(item) {
      const status = this.getInventoryStatus(item);
      return {
        expired: '已过期',
        low: '库存不足',
        expiring: '即将过期',
        normal: '正常'
      }[status] || '未知';
    }
  }
}
</script>

<style scoped>
.inventory-report {
  padding: 20px;
}

.report-title {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.report-card {
  padding: 20px;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>