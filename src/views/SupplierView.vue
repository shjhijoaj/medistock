<template>
  <div class="supplier-view">
    <h2 class="page-title">供应商管理</h2>
    
    <div class="search-panel">
      <el-input
        v-model="searchKeyword"
        placeholder="输入供应商名称、联系人或电话"
        clearable
        class="search-input"
        @keyup.enter.native="handleSearch"
        @clear="clearSearch"
      >
        <el-button 
          slot="append" 
          icon="el-icon-search" 
          @click="handleSearch"
        ></el-button>
      </el-input>
      
      <el-button 
        type="primary" 
        icon="el-icon-plus" 
        @click="openAddDialog"
        class="add-button"
      >
        新增供应商
      </el-button>
    </div>
    
    <!-- 搜索状态显示 -->
    <div v-if="hasSearchKeyword" class="search-status">
      <span>搜索"<strong>{{ searchKeyword }}</strong>" </span>
      <span class="search-result">找到 {{ filteredSuppliers.length }} 个供应商</span>
      <el-button 
        type="text" 
        icon="el-icon-close" 
        @click="clearSearch"
        v-if="hasSearchKeyword"
      >
        清除搜索
      </el-button>
    </div>
    
    <el-table 
      :data="filteredSuppliers" 
      border 
      style="width:100%"
      v-loading="loading"
      empty-text="没有找到匹配的供应商数据"
      class="supplier-table"
    >
      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="供应商名称">
        <template slot-scope="scope">
          <span class="supplier-name">
            {{ scope.row.name }}
            <el-tag v-if="scope.row.id === 1" size="mini" type="success">主供应商</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="contact" label="联系人">
        <template slot-scope="scope">
          <div class="contact-info">
            <i class="el-icon-user"></i>
            {{ scope.row.contact }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" width="150">
        <template slot-scope="scope">
          <div class="phone-info">
            <i class="el-icon-phone"></i>
            {{ scope.row.phone }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="联系地址" width="250"></el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            icon="el-icon-edit"
            @click="openEditDialog(scope.row)"
          >编辑</el-button>
          <el-button
            size="mini"
            type="danger"
            icon="el-icon-delete"
            @click="handleDelete(scope.row.id)"
            v-if="scope.row.id !== 1"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="supplierForm" 
        :rules="formRules" 
        ref="supplierForm" 
        label-width="100px"
        class="supplier-form"
      >
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="supplierForm.name" placeholder="请输入供应商名称"></el-input>
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="supplierForm.contact" placeholder="联系人姓名"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="supplierForm.phone" placeholder="联系电话"></el-input>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="supplierForm.address" placeholder="供应商地址"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            type="textarea"
            :rows="3"
            v-model="supplierForm.remark"
            placeholder="备注信息"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveSupplier">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'SupplierView',
  data() {
    return {
      searchKeyword: '',
      dialogVisible: false,
      isEditing: false,
      loading: false,
      supplierForm: {
        id: null,
        name: '',
        contact: '',
        phone: '',
        address: '',
        remark: ''
      },
      formRules: {
        name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
        contact: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
        phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
      }
    };
  },
  computed: {
    ...mapGetters('supplier', ['allSuppliers']),
    suppliers() {
      return this.allSuppliers || [];
    },
    dialogTitle() {
      return this.isEditing ? '编辑供应商' : '新增供应商';
    },
    hasSearchKeyword() {
      return this.searchKeyword.trim() !== '';
    },
    filteredSuppliers() {
      if (!this.searchKeyword) return this.suppliers;
      
      const keyword = this.searchKeyword.toLowerCase().trim();
      return this.suppliers.filter(supplier => {
        return (
          (supplier.name && supplier.name.toLowerCase().includes(keyword)) ||
          (supplier.contact && supplier.contact.toLowerCase().includes(keyword)) ||
          (supplier.phone && supplier.phone.includes(keyword))
        );
      });
    }
  },
  methods: {
    ...mapActions('supplier', [
      'fetchSuppliers', 
      'addSupplier', 
      'updateSupplier', 
      'deleteSupplier'
    ]),
    
    // 打开添加对话框
    openAddDialog() {
      this.isEditing = false;
      this.supplierForm = {
        id: null,
        name: '',
        contact: '',
        phone: '',
        address: '',
        remark: ''
      };
      this.dialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.supplierForm) {
          this.$refs.supplierForm.clearValidate();
        }
      });
    },
    
    // 打开编辑对话框
    openEditDialog(supplier) {
      this.isEditing = true;
      this.supplierForm = { ...supplier };
      this.dialogVisible = true;
    },
    
    // 执行搜索
    handleSearch() {
      if (!this.searchKeyword) {
        this.$message.info('请输入搜索关键词');
      }
    },
    
    // 清除搜索
    clearSearch() {
      this.searchKeyword = '';
    },
    
    // 保存供应商
    saveSupplier() {
      try {
        this.$refs.supplierForm.validate(async valid => {
          if (!valid) return;
          
          if (this.isEditing) {
            await this.updateSupplier(this.supplierForm);
            this.$message.success('供应商更新成功');
          } else {
            await this.addSupplier(this.supplierForm);
            this.$message.success('供应商添加成功');
          }
          
          this.dialogVisible = false;
          await this.fetchSuppliers();
        });
      } catch (error) {
        console.error('保存供应商失败:', error);
        this.$message.error('保存失败: ' + error.message);
      }
    },
    
    // 删除供应商
    async handleDelete(id) {
      this.$confirm('确定要删除该供应商吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await this.deleteSupplier(id);
        this.$message.success('供应商已删除');
        await this.fetchSuppliers();
      }).catch(() => {});
    }
  },
  async mounted() {
    this.loading = true;
    try {
      await this.fetchSuppliers();
    } catch (error) {
      console.error('加载供应商数据失败:', error);
      this.$message.error('加载供应商数据失败');
    }
    this.loading = false;
  }
}
</script>

<style scoped>
.supplier-view {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.search-panel {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.add-button {
  margin-left: auto;
}

.search-status {
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.search-result {
  margin-left: 15px;
  color: #409EFF;
  font-weight: 500;
}

.supplier-table {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.supplier-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.contact-info, .phone-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.supplier-form {
  padding: 10px 20px 0;
}

.dialog-footer {
  padding: 10px 20px 20px;
  text-align: right;
}
</style>