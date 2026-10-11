<template>
  <div class="dashboard-view">
    <!-- 页面头部保持不变 -->
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-s-home"></i> 系统概览
      </h2>
    </div>
    
    <!-- 统计卡片区域 - 修复即将过期统计 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon drug">
              <i class="el-icon-first-aid-kit"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">药品总数</div>
              <div class="stat-value">{{ medicineCount }}</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon supplier">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">供应商数量</div>
              <div class="stat-value">{{ supplierCount }}</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon warning">
              <i class="el-icon-warning-outline"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">库存不足</div>
              <div class="stat-value">{{ lowStockCount }}</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon expire">
              <i class="el-icon-timer"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">即将过期</div>
              <!-- 修复：显示正确的即将过期数量 -->
              <div class="stat-value">{{ expiringCount }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 表格区域保持不变 -->
    <div class="tables-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover" class="table-card">
            <div class="card-header">
              <h3><i class="el-icon-warning"></i> 药品预警</h3>
            </div>
            <el-table 
              :data="warningMedicines" 
              border 
              height="300"
              empty-text="暂无预警药品"
            >
              <el-table-column prop="name" label="药品名称" min-width="120" />
              <el-table-column prop="spec" label="规格" width="100" />
              <el-table-column prop="stock" label="当前库存" width="100" align="center">
                <template slot-scope="scope">
                  <span :class="{'text-danger': scope.row.stock < scope.row.minStock}">
                    {{ scope.row.stock }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="minStock" label="最低库存" width="100" align="center" />
              <el-table-column prop="expiryDate" label="有效期" width="120" align="center">
                <template slot-scope="scope">
                  <span :class="getExpiryStatusClass(scope.row.expiryDate)">
                    {{ scope.row.expiryDate || '--' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="150" align="center">
  <template slot-scope="scope">
    <span v-if="getMedicineStatus(scope.row.expiryDate) === 'expired'" class="expired-status">
      已过期
    </span>
    <el-tag v-else-if="getMedicineStatus(scope.row.expiryDate) === 'expiring-soon'" type="warning" size="small">
      即将过期
    </el-tag>
    <span v-else-if="scope.row.stock < scope.row.minStock" class="low-stock-status">
      库存不足
    </span>
    <span v-else class="normal-status">
      正常
    </span>
  </template>
</el-table-column>
            </el-table>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card shadow="hover" class="table-card">
            <div class="card-header">
              <h3><i class="el-icon-time"></i> 最近入库记录</h3>
            </div>
            <el-table 
              :data="recentInbounds" 
              border 
              height="300"
              empty-text="暂无入库记录"
            >
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="medicineName" label="药品名称" min-width="120" />
              <el-table-column prop="batch" label="批号" width="100" />
              <el-table-column prop="quantity" label="数量" width="80" align="center" />
              <el-table-column prop="expiryDate" label="有效期" width="120" align="center">
                <template slot-scope="scope">
                  <span :class="getExpiryStatusClass(scope.row.expiryDate)">
                    {{ scope.row.expiryDate || '--' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag 
                    v-if="isExpiringSoon(scope.row.expiryDate)" 
                    type="warning" 
                    size="small"
                  >
                    即将过期
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="supplier" label="供应商" min-width="120" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 图表区域保持不变 -->
    <div class="chart-section">
      <el-card shadow="hover">
        <div class="card-header">
          <h3><i class="el-icon-data-line"></i> 近期交易趋势</h3>
        </div>
        <div class="chart-container">
          <div ref="trendChart" style="height: 300px;"></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

export default {
  name: 'DashboardView',
  meta: {
    title: '系统概览'
  },
  data() {
    return {
      chart: null,
      chartData: {
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
      }
    };
  },
  computed: {
    ...mapGetters('medicine', [
      'allMedicines', 
      'inboundRecords', 
      'lowStockMedicines',
      'allSuppliers'
    ]),
    
    medicineCount() {
      return this.allMedicines?.length || 0;
    },
    
    supplierCount() {
      return this.allSuppliers?.length || 0;
    },
    
    lowStockCount() {
      return this.lowStockMedicines?.length || 0;
    },
    
    // 修复：正确计算即将过期药品数量
   expiringCount() {
    if (!this.allMedicines) return 0;
    
    return this.allMedicines.filter(medicine => {
      return this.isExpiringSoon(medicine.expiryDate);
    }).length;
  },
    
    warningMedicines() {
      if (!this.allMedicines) return [];
      
      // 获取库存不足的药品
      const lowStock = this.lowStockMedicines || [];
      
      // 获取即将过期的药品
      const expiring = this.allMedicines.filter(medicine => {
        return this.isExpiringSoon(medicine.expiryDate);
      });
      
      // 合并并去重
      const combined = [...lowStock];
      const lowStockIds = new Set(lowStock.map(m => m.id));
      
      expiring.forEach(med => {
        if (!lowStockIds.has(med.id)) {
          combined.push(med);
        }
      });
      
      return combined.slice(0, 5);
    },
    
    recentInbounds() {
      return this.inboundRecords?.slice(0, 5) || [];
    }
  },
  methods: {
    ...mapActions('medicine', ['fetchMedicines', 'fetchInboundRecords', 'fetchSuppliers']),
    
    // 获取有效期状态样式
    getExpiryStatusClass(expiryDate) {
      if (!expiryDate) return '';
      
      const today = dayjs();
      const expiry = dayjs(expiryDate);
      const days = expiry.diff(today, 'day');
      
      if (days < 0) return 'expired';
      if (days < 30) return 'expiring-soon';
      return '';
    },
    // 判断药品状态 - 更全面的方法
  getMedicineStatus(expiryDate) {
    if (!expiryDate) return 'no-expiry';
    
    const today = dayjs().startOf('day'); // 只考虑日期部分
    const expiry = dayjs(expiryDate).startOf('day');
    const days = expiry.diff(today, 'day');
    
    if (days < 0) {
      return 'expired';
    } else if (days < 30) {
      return 'expiring-soon';
    } else {
      return 'valid';
    }
  },
  
  // 专门用于统计卡片的方法

    // 判断是否即将过期（30天内）
    // 判断是否即将过期（30天内）
  isExpiringSoon(expiryDate) {
    return this.getMedicineStatus(expiryDate) === 'expiring-soon';
  },
    initChart() {
      if (!this.$refs.trendChart) return;
      
      this.chart = echarts.init(this.$refs.trendChart);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = `${params[0].axisValue}<br>`;
            params.forEach(item => {
              const type = item.seriesName === '药品入库' ? '入库' : '出库';
              result += `${item.marker} ${item.seriesName}: ${item.value}<br>`;
            });
            return result;
          }
        },
        legend: {
          data: ['药品入库', '药品出库'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.chartData.inbound.map(item => item.date)
        },
        yAxis: {
          type: 'value',
          name: '数量'
        },
        series: [
          {
            name: '药品入库',
            type: 'line',
            smooth: true,
            data: this.chartData.inbound.map(item => item.quantity),
            lineStyle: {
              width: 3,
              color: '#36a3f7'
            },
            itemStyle: {
              color: '#36a3f7'
            }
          },
          {
            name: '药品出库',
            type: 'line',
            smooth: true,
            data: this.chartData.outbound.map(item => item.quantity),
            lineStyle: {
              width: 3,
              color: '#f56c6c'
            },
            itemStyle: {
              color: '#f56c6c'
            }
          }
        ]
      };
      
      this.chart.setOption(option);
      
      // 响应窗口变化
      window.addEventListener('resize', () => {
        this.chart.resize();
      });
    }
  },
  async mounted() {
    await this.fetchMedicines();
    await this.fetchInboundRecords();
    await this.fetchSuppliers();
    
    this.$nextTick(() => {
      this.initChart();
    });
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.dashboard-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.stats-section {
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.drug { background-color: #36a3f7; }
.supplier { background-color: #34bfa3; }
.warning { background-color: #f56c6c; }
.expire { background-color: #ffc107; }

.stat-info {
  padding: 20px 0;
  min-height: 80px;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.tables-section {
  margin-bottom: 30px;
}

.table-card {
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f5f7fa;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-container {
  padding: 15px;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-success {
  color: #67c23a;
}

/* 有效期状态样式 */
.expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}
</style>