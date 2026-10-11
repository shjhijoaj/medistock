<template>
  <div class="outbound-view">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-upload2"></i> 药品出库
      </h2>
    </div>
    
    <el-card class="form-card">
      <el-form 
        ref="outboundForm" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="*药品名称" prop="medicineName">
              <el-input 
                v-model="form.medicineName" 
                placeholder="输入药品名称"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="*批号" prop="batch">
              <el-input 
                v-model="form.batch" 
                placeholder="药品批号"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="*领用人" prop="recipient">
              <el-input 
                v-model="form.recipient" 
                placeholder="领用人姓名"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="出库原因">
              <el-input
                type="textarea"
                :rows="3"
                v-model="form.reason"
                placeholder="出库原因说明"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="*出库数量" prop="quantity">
              <el-input-number 
                v-model="form.quantity" 
                :min="1" 
                :max="maxQuantity"
                controls-position="right"
                style="width:100%"
              />
              <div class="stock-info">当前最大出库量: {{ maxQuantity }}</div>
            </el-form-item>
            
            <el-form-item label="*出库日期" prop="date">
              <el-date-picker
                v-model="form.date"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                style="width:100%"
              />
            </el-form-item>
            
            <el-form-item label="部门">
              <el-input 
                v-model="form.department" 
                placeholder="所属部门"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button 
            type="primary" 
            icon="el-icon-check" 
            @click="submitForm"
            class="submit-button"
          >
            提交出库
          </el-button>
          <el-button 
            icon="el-icon-refresh" 
            @click="resetForm"
            class="reset-button"
          >
            重置表单
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <div class="recent-section">
      <h3 class="section-title">
        <i class="el-icon-timer"></i> 最近出库记录
      </h3>
      <el-table 
        :data="recentOutbounds" 
        border 
        stripe 
        empty-text="暂无出库记录"
        style="width:100%"
      >
        <el-table-column prop="date" label="日期" width="120" align="center" />
        <el-table-column prop="medicineName" label="药品名称" min-width="150" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="recipient" label="领用人" width="120" />
        <el-table-column prop="department" label="部门" min-width="120" />
      </el-table>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import dayjs from 'dayjs';

export default {
  name: 'OutboundView',
  meta: {
    title: '药品出库'
  },
  data() {
    return {
      form: {
        medicineName: '',
        quantity: 1,
        batch: '',
        date: dayjs().format('YYYY-MM-DD'),
        recipient: '',
        department: '',
        reason: ''
      },
      rules: {
        medicineName: [
          { required: true, message: '药品名称不能为空', trigger: 'blur' }
        ],
        batch: [
          { required: true, message: '批号不能为空', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '出库数量不能为空', trigger: 'blur' }
        ],
        date: [
          { required: true, message: '出库日期不能为空', trigger: 'change' }
        ],
        recipient: [
          { required: true, message: '领用人不能为空', trigger: 'blur' }
        ]
      },
      maxQuantity: 100
    };
  },
  watch: {
    'form.medicineName'(newVal) {
      this.updateMaxQuantity();
    },
    'form.batch'(newVal) {
      this.updateMaxQuantity();
    }
  },
  computed: {
    ...mapGetters('medicine', ['allMedicines', 'outboundRecords']),
    recentOutbounds() {
      return this.outboundRecords?.slice(0, 5) || [];
    }
  },
  methods: {
    ...mapActions('medicine', ['outboundMedicine', 'fetchOutboundRecords']),
    
    updateMaxQuantity() {
      if (this.form.medicineName && this.form.batch) {
        const medicine = this.allMedicines.find(m => 
          m.name === this.form.medicineName && 
          m.batch === this.form.batch
        );
        
        this.maxQuantity = medicine ? medicine.stock : 0;
      } else {
        this.maxQuantity = 100;
      }
    },
    
    submitForm() {
      this.$refs.outboundForm.validate(valid => {
        if (valid) {
          // 验证出库数量
          if (this.form.quantity > this.maxQuantity) {
            this.$message.error('出库数量不能超过可用库存');
            return;
          }
          
          const record = {
            ...this.form,
            date: this.form.date || dayjs().format('YYYY-MM-DD'),
            time: dayjs().format('HH:mm')
          };
          
          this.outboundMedicine(record);
          this.$message.success('药品出库成功');
          
          // 刷新相关数据
          this.fetchOutboundRecords();
          
          // 重置表单部分字段
          this.form = {
            ...this.form,
            quantity: 1,
            batch: '',
            reason: ''
          };
        } else {
          this.$message.error('请填写完整必填信息');
          return false;
        }
      });
    },
    
    resetForm() {
      this.$refs.outboundForm.resetFields();
      this.form = {
        medicineName: '',
        quantity: 1,
        batch: '',
        date: dayjs().format('YYYY-MM-DD'),
        recipient: '',
        department: '',
        reason: ''
      };
      this.maxQuantity = 100;
    }
  },
  async mounted() {
    await this.fetchOutboundRecords();
  }
}
</script>

<style scoped>
.outbound-view {
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
  display: flex;
  align-items: center;
}

.page-title i {
  margin-right: 10px;
}

.form-card {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  background: #fff;
}

.stock-info {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.section-title {
  margin: 15px 0;
  font-size: 18px;
  color: #606266;
  font-weight: 500;
}

.recent-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.submit-button {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.reset-button {
  background: #fff;
  border-color: #d9d9d9;
  color: #606266;
}
</style>