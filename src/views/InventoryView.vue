<template>
  <div class="inventory-view">
    <div class="filter-container">
      <el-input
        v-model="listQuery.name"
        placeholder="搜索药品名称或规格"
        clearable
        style="width: 250px;"
        @keyup.enter.native="fetchMedicines"
      />
      
      <el-select
        v-model="listQuery.status"
        placeholder="库存状态"
        clearable
        style="width: 150px; margin-left: 10px;"
        @change="fetchMedicines"
      >
        <el-option label="所有状态" value=""></el-option>
        <el-option label="库存充足" value="normal"></el-option>
        <el-option label="库存不足" value="low"></el-option>
        <el-option label="即将过期" value="expiring"></el-option>
      </el-select>
      
      <el-button
        type="primary"
        icon="el-icon-search"
        style="margin-left: 10px;"
        @click="fetchMedicines"
      >
        搜索
      </el-button>
      
      <el-button
        type="success"
        icon="el-icon-refresh"
        style="margin-left: 10px;"
        @click="fetchMedicines"
      >
        刷新
      </el-button>
    </div>
    
    <el-table
      :data="filteredMedicines"
      border
      stripe
      v-loading="loading"
      style="width: 100%; margin-top: 20px;"
      @sort-change="handleSortChange"
    >
      <el-table-column 
        label="药品编号" 
        prop="id" 
        width="90" 
        align="center"
        sortable="custom"
      ></el-table-column>
      <el-table-column 
        label="药品名称" 
        prop="name" 
        min-width="180"
        sortable="custom"
      ></el-table-column>
      <el-table-column 
        label="规格" 
        prop="spec" 
        width="120"
        sortable="custom"
      ></el-table-column>
      <el-table-column 
        label="批号" 
        prop="batch" 
        width="140"
        sortable="custom"
      ></el-table-column>
      <el-table-column 
        label="当前库存" 
        prop="stock" 
        width="100" 
        align="right"
        sortable="custom"
      >
        <template slot-scope="scope">
          <span :class="{ 
            'text-danger': scope.row.stock < scope.row.minStock,
            'text-warning': scope.row.stock < scope.row.minStock * 2
          }">
            {{ scope.row.stock }}
          </span>
          <el-tooltip 
            v-if="scope.row.stock < scope.row.minStock" 
            content="库存不足!"
            placement="top"
          >
            <i class="el-icon-warning-outline" style="margin-left:5px;color:#F56C6C;"></i>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column 
        label="最低库存" 
        prop="minStock" 
        width="100" 
        align="right"
        sortable="custom"
      ></el-table-column>
      <el-table-column 
        label="有效期" 
        prop="expiryDate" 
        width="120"
        sortable="custom"
      >
        <template slot-scope="scope">
          <span :class="getExpiryClass(scope.row.expiryDate)">
            {{ scope.row.expiryDate }}
          </span>
          <el-tooltip 
            v-if="isExpiring(scope.row.expiryDate)" 
            :content="`还有 ${daysUntilExpiry(scope.row.expiryDate)} 天过期`" 
            placement="top"
          >
            <i class="el-icon-time" style="margin-left:5px;color:#E6A23C;"></i>
          </el-tooltip>
          <el-tooltip 
            v-if="isExpired(scope.row.expiryDate)" 
            content="已过期!" 
            placement="top"
          >
            <i class="el-icon-warning" style="margin-left:5px;color:#F56C6C;"></i>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column 
        label="库位" 
        prop="location" 
        width="150"
      ></el-table-column>
      <el-table-column 
        label="状态" 
        width="120"
      >
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row)" size="small">
            {{ getStatusText(scope.row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column 
        label="操作" 
        align="center" 
        width="140"
      >
        <template slot-scope="scope">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="small"
            @click="handleEdit(scope.row)"
          >编辑</el-button>
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="small"
            @click="handleDelete(scope.row.id)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="listQuery.page"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="listQuery.limit"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      style="margin-top: 20px;"
    ></el-pagination>
    
    <!-- 库存调整对话框 -->
    <el-dialog
      title="药品库存调整"
      :visible.sync="adjustDialogVisible"
      width="500px"
    >
      <el-form :model="adjustForm" ref="adjustForm" label-width="100px">
        <el-form-item label="药品名称">
          <el-input :value="currentMedicine.name" disabled></el-input>
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="currentMedicine.stock" disabled></el-input>
        </el-form-item>
        <el-form-item label="调整数量" prop="quantity" required>
          <el-input-number 
            v-model="adjustForm.quantity" 
            :min="-1000" 
            :max="1000" 
            controls-position="right"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-select v-model="adjustForm.type" placeholder="请选择调整类型">
            <el-option label="入库" value="inbound"></el-option>
            <el-option label="出库" value="outbound"></el-option>
            <el-option label="盘点调整" value="adjustment"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            type="textarea"
            :rows="3"
            v-model="adjustForm.remark"
            placeholder="调整说明"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="adjustDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAdjust">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import dayjs from 'dayjs';

export default {
  name: 'InventoryView',
  meta: {
    title: '库存管理'
  },
  data() {
    return {
      loading: false,
      filteredMedicines: [],
      total: 0,
      listQuery: {
        page: 1,
        limit: 20,
        name: '',
        status: '',
        sortField: '',
        sortOrder: ''
      },
      adjustDialogVisible: false,
      currentMedicine: {},
      adjustForm: {
        quantity: 0,
        type: 'inbound',
        remark: ''
      }
    };
  },
  computed: {
    ...mapGetters('medicine', ['allMedicines', 'medicineById'])
  },
  watch: {
    allMedicines: {
      immediate: true,
      handler(newVal) {
        this.filteredMedicines = [...newVal];
        this.total = newVal.length;
      }
    }
  },
  methods: {
    ...mapActions('medicine', [
      'fetchMedicines', 
      'updateMedicine', 
      'deleteMedicine',
      'inboundMedicine'
    ]),
    
    async fetchMedicines() {
      try {
        this.loading = true;
        await this.$store.dispatch('medicine/fetchMedicines');
        this.loading = false;
      } catch (error) {
        console.error('获取药品数据失败:', error);
        this.loading = false;
        this.$message.error('获取药品数据失败');
      }
    },
    
    handleSizeChange(size) {
      this.listQuery.limit = size;
      this.fetchMedicines();
    },
    
    handleCurrentChange(page) {
      this.listQuery.page = page;
      this.fetchMedicines();
    },
    
    handleSortChange({ column, prop, order }) {
      this.listQuery.sortField = prop;
      this.listQuery.sortOrder = order === 'ascending' ? 'asc' : 'desc';
      this.fetchMedicines();
    },
    
    handleEdit(row) {
      this.$router.push(`/medicine/edit/${row.id}`);
    },
    
    handleDelete(id) {
      this.$confirm('确定要删除该药品吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await this.deleteMedicine(id);
          this.$message.success('药品删除成功');
          this.fetchMedicines();
        } catch (error) {
          console.error('删除药品失败:', error);
          this.$message.error('删除药品失败');
        }
      }).catch(() => {});
    },
    
    openAdjustDialog(medicine) {
      this.currentMedicine = medicine;
      this.adjustForm = {
        quantity: 0,
        type: 'inbound',
        remark: ''
      };
      this.adjustDialogVisible = true;
    },
    
    async confirmAdjust() {
      try {
        const medicineId = this.currentMedicine.id;
        const medicine = this.medicineById(medicineId);
        
        if (!medicine) {
          this.$message.error('找不到该药品信息');
          return;
        }
        
        const newStock = medicine.stock + this.adjustForm.quantity;
        
        // 更新药品库存
        await this.updateMedicine({
          ...medicine,
          stock: newStock
        });
        
        // 记录库存调整操作
        await this.inboundMedicine({
          medicineId,
          medicineName: medicine.name,
          quantity: this.adjustForm.quantity,
          batch: medicine.batch || '',
          supplier: medicine.supplier || '',
          location: medicine.location || '',
          remark: `库存调整: ${this.adjustForm.remark}`
        });
        
        this.$message.success('库存调整成功');
        this.adjustDialogVisible = false;
        this.fetchMedicines();
      } catch (error) {
        console.error('库存调整失败:', error);
        this.$message.error('库存调整失败: ' + error.message);
      }
    },
    
    daysUntilExpiry(expiryDate) {
      if (!expiryDate) return null;
      const today = dayjs();
      const expiry = dayjs(expiryDate);
      return expiry.diff(today, 'day');
    },
    
    isExpiring(expiryDate) {
      if (!expiryDate) return false;
      const days = this.daysUntilExpiry(expiryDate);
      return days > 0 && days < 30;
    },
    
    isExpired(expiryDate) {
      if (!expiryDate) return false;
      return this.daysUntilExpiry(expiryDate) < 0;
    },
    
    getExpiryClass(expiryDate) {
      const days = this.daysUntilExpiry(expiryDate);
      if (days === null) return '';
      if (days < 0) return 'expired';
      if (days < 30) return 'expiring-soon';
      return '';
    },
    
    getInventoryStatus(medicine) {
      if (this.isExpired(medicine.expiryDate)) return 'expired';
      if (medicine.stock < medicine.minStock) return 'low';
      if (this.isExpiring(medicine.expiryDate)) return 'expiring';
      return 'normal';
    },
    
    getStatusTagType(medicine) {
      const status = this.getInventoryStatus(medicine);
      return {
        expired: 'danger',
        low: 'warning',
        expiring: 'warning',
        normal: 'success'
      }[status] || '';
    },
    
    getStatusText(medicine) {
      const status = this.getInventoryStatus(medicine);
      return {
        expired: '已过期',
        low: '库存不足',
        expiring: '即将过期',
        normal: '正常'
      }[status] || '未知';
    }
  },
  async mounted() {
    await this.fetchMedicines();
  }
}
</script>

<style scoped>
.inventory-view {
  padding: 20px;
}

.filter-container {
  display: flex;
  margin-bottom: 20px;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}
</style>