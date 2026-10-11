import dayjs from 'dayjs'
<template>
  <div class="transaction-report">
    <div class="filter-container">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="yyyy-MM-dd"
        @change="handleDateChange"
        style="margin-right: 15px;"
      ></el-date-picker>
      
      <el-select
        v-model="transactionType"
        placeholder="交易类型"
        clearable
        @change="handleTypeChange"
        style="width: 150px; margin-right: 15px;"
      >
        <el-option label="全部" value="all"></el-option>
        <el-option label="入库" value="inbound"></el-option>
        <el-option label="出库" value="outbound"></el-option>
      </el-select>
      
      <el-select
        v-model="medicineId"
        placeholder="选择药品"
        clearable
        filterable
        remote
        :remote-method="searchMedicines"
        :loading="searchLoading"
        style="width: 250px; margin-right: 15px;"
      >
        <el-option
          v-for="item in medicineOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id">
        </el-option>
      </el-select>
      
      <el-button type="primary" @click="fetchData">查询</el-button>
      <el-button type="success" @click="exportData" style="float: right;">
        <i class="el-icon-download"></i> 导出报表
      </el-button>
    </div>
    
    <el-table :data="reportData" border stripe style="width: 100%; margin-top: 20px;">
      <el-table-column prop="date" label="日期" width="120"></el-table-column>
      <el-table-column prop="medicineName" label="药品名称" width="180"></el-table-column>
      <el-table-column label="交易类型" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.type === 'inbound' ? 'success' : 'danger'">
            {{ scope.row.type === 'inbound' ? '入库' : '出库' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="80"></el-table-column>
      <el-table-column prop="batch" label="批号" width="120"></el-table-column>
      <el-table-column prop="supplierName" label="供应商" width="150"></el-table-column>
      <el-table-column prop="operator" label="操作员"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import dayjs from 'dayjs';

export default {
  data() {
    return {
      dateRange: [],
      transactionType: '',
      medicineId: '',
      medicineOptions: [],
      searchLoading: false,
      reportData: []
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        // 这里是模拟数据，实际中应从API获取
        this.reportData = [
          {
            id: 1,
            date: '2023-05-10',
            medicineName: '阿莫西林胶囊',
            medicineId: 1,
            type: 'inbound',
            quantity: 100,
            batch: 'AB2023001',
            supplierName: '广州医药集团有限公司',
            operator: '管理员'
          },
          {
            id: 2,
            date: '2023-05-12',
            medicineName: '布洛芬缓释胶囊',
            medicineId: 2,
            type: 'inbound',
            quantity: 80,
            batch: 'CD2023002',
            supplierName: '国药控股广州有限公司',
            operator: '管理员'
          }
        ];
      } catch (error) {
        console.error('获取交易报表失败', error);
        this.$message.error('获取交易报表失败');
      }
    },
    handleDateChange(value) {
      console.log('日期范围变化', value);
    },
    handleTypeChange(value) {
      console.log('交易类型变化', value);
    },
    async searchMedicines(query) {
      if (query !== '') {
        this.searchLoading = true;
        try {
          // 模拟药品搜索
          const mockMedicines = [
            { id: 1, name: '阿莫西林胶囊' },
            { id: 2, name: '布洛芬缓释胶囊' },
            { id: 3, name: '感冒灵颗粒' }
          ];
          this.medicineOptions = mockMedicines.filter(medicine => 
            medicine.name.includes(query)
          );
        } catch (error) {
          console.error('搜索药品失败', error);
        } finally {
          this.searchLoading = false;
        }
      } else {
        this.medicineOptions = [];
      }
    },
    exportData() {
      this.$message.success('导出报表功能正在开发中');
    }
  }
}
</script>

<style scoped>
.filter-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>