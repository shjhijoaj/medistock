<template>
  <div class="inbound-view">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-circle-plus"></i> 药品入库
      </h2>
    </div>
    
    <el-card class="form-card">
      <el-form 
        ref="inboundForm" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        label-position="top"
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
            
            <el-form-item label="*批次" prop="batch">
              <el-input 
                v-model="form.batch" 
                placeholder="药品批号"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="供应商" prop="supplierId">
              <el-select 
                v-model="form.supplierId" 
                placeholder="请选择供应商"
                filterable
                clearable
                style="width:100%"
                :loading="suppliersLoading"
              >
                <el-option
                  v-for="supplier in suppliers"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
                <el-option 
                  label="新增供应商" 
                  value="new" 
                  @click.native="addNewSupplier" 
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="备注说明">
              <el-input
                type="textarea"
                :rows="3"
                v-model="form.remark"
                placeholder="入库备注信息"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="*入库数量" prop="quantity">
              <el-input-number 
                v-model="form.quantity" 
                :min="1" 
                :max="10000"
                controls-position="right"
                style="width:100%"
              />
            </el-form-item>
            
            <el-form-item label="*入库日期" prop="date">
              <el-date-picker
                v-model="form.date"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                style="width:100%"
              />
            </el-form-item>
            
            <!-- 有效期字段 -->
            <el-form-item label="*有效期" prop="expiryDate" required>
              <el-date-picker
                v-model="form.expiryDate"
                type="date"
                placeholder="选择有效期"
                value-format="yyyy-MM-dd"
                style="width:100%"
                :picker-options="expiryDateOptions"
              />
            </el-form-item>
            
            <el-form-item label="仓库位置">
              <el-input 
                v-model="form.location" 
                placeholder="存放位置"
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
            提交入库
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
        <i class="el-icon-timer"></i> 最近入库记录
      </h3>
      <el-table 
        :data="recentInbounds" 
        border 
        stripe 
        empty-text="暂无入库记录"
        style="width:100%"
      >
        <el-table-column prop="date" label="日期" width="120" align="center" />
        <el-table-column prop="medicineName" label="药品名称" min-width="150" />
        <el-table-column prop="batch" label="批号" width="120" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="expiryDate" label="有效期" width="120" align="center" />
        <el-table-column prop="supplier" label="供应商" min-width="120" />
      </el-table>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import dayjs from 'dayjs';

export default {
  name: 'InboundView',
  meta: {
    title: '药品入库'
  },
  data() {
    // 验证有效期规则，确保有效期在入库日期之后
    const validateExpiryDate = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请选择药品有效期'));
        return;
      }
      
      const inboundDate = dayjs(this.form.date);
      const expiryDate = dayjs(value);
      
      if (expiryDate.isBefore(inboundDate)) {
        callback(new Error('药品有效期不能早于入库日期'));
      } else {
        callback();
      }
    };
    
    return {
      form: {
        medicineName: '',
        quantity: 1,
        batch: '',
        date: dayjs().format('YYYY-MM-DD'),
        expiryDate: '', // 有效期字段
        supplierId: null,
        location: '',
        remark: ''
      },
      rules: {
        medicineName: [
          { required: true, message: '药品名称不能为空', trigger: 'blur' }
        ],
        batch: [
          { required: true, message: '批号不能为空', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '入库数量不能为空', trigger: 'blur' }
        ],
        date: [
          { required: true, message: '入库日期不能为空', trigger: 'change' }
        ],
        expiryDate: [
          { required: true, validator: validateExpiryDate, trigger: 'change' }
        ],
        supplierId: [
          { required: true, message: '请选择供应商', trigger: 'change' }
        ]
      },
      suppliersLoading: false,
      // 有效期日期选项配置
      expiryDateOptions: {
        disabledDate: (time) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // 禁止选择今天之前的日期
          if (this.form.date) {
            const minDate = new Date(this.form.date);
            minDate.setHours(0, 0, 0, 0);
            return time.getTime() < minDate.getTime();
          }
          
          return time.getTime() < today.getTime();
        }
      }
    };
  },
  computed: {
    ...mapGetters('medicine', ['allSuppliers', 'inboundRecords']),
    // 关键修复：确保供应商列表实时更新
    suppliers() {
      return this.allSuppliers || [];
    },
    recentInbounds() {
      return (this.inboundRecords?.slice(0, 5) || []).map(item => {
        // 查找供应商名称
        const supplier = this.suppliers.find(s => s.id === item.supplierId);
        return {
          ...item,
          supplier: supplier ? supplier.name : '未知供应商'
        };
      });
    }
  },
  methods: {
    ...mapActions('medicine', [
      'fetchSuppliers',
      'addSupplier',
      'inboundMedicine',
      'fetchInboundRecords'
    ]),
    
    async addNewSupplier() {
      this.$prompt('请输入新供应商名称', '添加供应商', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^.{2,50}$/,
        inputErrorMessage: '供应商名称长度需在2-50个字符之间'
      }).then(async ({ value }) => {
        if (!value.trim()) return;
        
        this.suppliersLoading = true;
        
        try {
          // 添加新供应商 - 关键修改：返回新添加的供应商
          const newSupplier = await this.addSupplier({ 
            name: value.trim() 
          });
          
          // 关键修改：确保供应商列表刷新
          await this.fetchSuppliers();
          
          // 自动选择新添加的供应商
          this.form.supplierId = newSupplier.id;
          
          this.$message.success(`供应商 "${value}" 已添加`);
        } catch (error) {
          console.error('添加供应商失败:', error);
          this.$message.error('添加供应商失败: ' + error.message);
        } finally {
          this.suppliersLoading = false;
        }
      }).catch(() => {});
    },
    
    submitForm() {
      this.$refs.inboundForm.validate(async valid => {
        if (!valid) {
          this.$message.error('请填写完整必填信息');
          return;
        }
        
        try {
          // 创建入库记录对象
          const record = {
            ...this.form,
            // 确保日期格式正确
            date: this.form.date || dayjs().format('YYYY-MM-DD'),
            time: dayjs().format('HH:mm')
          };
          
          // 提交入库
          await this.inboundMedicine(record);
          this.$message.success('药品入库成功');
          
          // 刷新相关数据
          await this.fetchInboundRecords();
          
          // 重置表单部分字段（保留供应商选择）
          this.form = {
            ...this.form,
            medicineName: '',
            quantity: 1,
            batch: '',
            expiryDate: '', // 重置有效期
            remark: '',
            location: ''
          };
        } catch (error) {
          console.error('入库失败:', error);
          this.$message.error(`入库失败: ${error.message}`);
        }
      });
    },
    
    resetForm() {
      this.$refs.inboundForm.resetFields();
      this.form = {
        medicineName: '',
        quantity: 1,
        batch: '',
        date: dayjs().format('YYYY-MM-DD'),
        expiryDate: '', // 重置有效期
        supplierId: null,
        location: '',
        remark: ''
      };
    }
  },
  async mounted() {
    // 关键修改：确保供应商列表正确加载
    this.suppliersLoading = true;
    try {
      await this.fetchSuppliers();
      
      // 如果有入库记录则加载
      if (!this.inboundRecords || this.inboundRecords.length === 0) {
        await this.fetchInboundRecords();
      }
      
      // 设置默认有效期（入库日期+1年）
      this.form.expiryDate = dayjs().add(1, 'year').format('YYYY-MM-DD');
    } catch (error) {
      console.error('初始化数据失败:', error);
      this.$message.error('初始化数据失败: ' + error.message);
    } finally {
      this.suppliersLoading = false;
    }
  },
  
  // 监听入库日期变化，自动更新有效期
  watch: {
    'form.date'(newDate) {
      if (newDate && !this.form.expiryDate) {
        // 如果入库日期变化且有效期为空，设置默认有效期
        this.form.expiryDate = dayjs(newDate).add(1, 'year').format('YYYY-MM-DD');
      } else if (newDate && this.form.expiryDate) {
        const expiry = dayjs(this.form.expiryDate);
        const inbound = dayjs(newDate);
        
        // 如果当前有效期早于入库日期，自动调整
        if (expiry.isBefore(inbound)) {
          this.form.expiryDate = inbound.add(1, 'year').format('YYYY-MM-DD');
        }
      }
    }
  }
}
</script>

<style scoped>
.inbound-view {
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
  color: #409EFF;
}

.form-card {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  background: #fff;
  border: 1px solid #ebeef5;
}

.form-card .el-form-item {
  margin-bottom: 15px;
}

.section-title {
  margin: 15px 0;
  font-size: 18px;
  color: #606266;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 8px;
  color: #E6A23C;
}

.recent-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  border: 1px solid #ebeef5;
}

.submit-button {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-color: #096dd9;
  color: #fff;
  font-weight: 500;
  padding: 12px 30px;
}

.submit-button:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  border-color: #1890ff;
}

.reset-button {
  border-color: #d9d9d9;
  color: #606266;
  padding: 12px 30px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .el-col-12 {
    width: 100%;
  }
  
  .form-card .el-form-item {
    margin-bottom: 18px;
  }
  
  .submit-button, .reset-button {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>