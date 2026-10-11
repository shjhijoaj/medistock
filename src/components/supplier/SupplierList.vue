<template>
  <div class="supplier-list">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入供应商名称、联系人或电话"
        clearable
        @keyup.enter.native="doSearch"
        @clear="doSearch"
        class="search-input"
      >
        <el-button 
          slot="append" 
          icon="el-icon-search" 
          @click="doSearch"
        />
      </el-input>
    </div>
    
    <!-- 搜索状态显示 -->
    <div v-if="hasSearchKeyword" class="search-status">
      <div class="search-result">
        共找到 <span class="highlight">{{ filteredSuppliers.length }}</span> 个供应商
      </div>
      <el-button 
        type="text" 
        icon="el-icon-close" 
        @click="clearSearch"
        v-if="hasSearchKeyword"
      >
        清除搜索
      </el-button>
    </div>
    
    <!-- 供应商列表 -->
    <div class="supplier-table-container">
      <el-table
        :data="filteredSuppliers"
        border
        fit
        highlight-current-row
        stripe
        v-loading="loading"
        empty-text="没有找到供应商数据"
        class="supplier-table"
      >
        <el-table-column label="ID" prop="id" align="center" width="80" sortable />
        <el-table-column label="供应商名称" prop="name" min-width="180" sortable>
          <template slot-scope="scope">
            <span class="supplier-name">
              {{ scope.row.name }}
              <el-tag 
                v-if="scope.row.id === 1" 
                size="mini" 
                type="success"
                style="margin-left: 5px;"
              >
                主要
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="联系人" prop="contact" width="120" sortable>
          <template slot-scope="scope">
            <div class="contact-info">
              <i class="el-icon-user"></i>
              {{ scope.row.contact }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系电话" prop="phone" width="140" sortable>
          <template slot-scope="scope">
            <div class="phone-info">
              <i class="el-icon-phone"></i>
              <el-link :href="`tel:${scope.row.phone}`">
                {{ scope.row.phone }}
              </el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系地址" prop="address" min-width="200">
          <template slot-scope="scope">
            <div class="address-info">
              <i class="el-icon-location-outline"></i>
              {{ scope.row.address }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button 
              size="small" 
              type="primary" 
              icon="el-icon-edit"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              icon="el-icon-delete"
              @click="handleDelete(scope.row.id)"
              v-if="scope.row.id !== 1"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 添加供应商按钮 -->
    <div class="add-supplier-btn">
      <el-button 
        type="primary" 
        icon="el-icon-plus" 
        circle
        size="medium"
        @click="handleCreate"
      />
      <div class="btn-tip">添加供应商</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SupplierList',
  props: {
    supplierList: {
      type: Array,
      default: () => []
    },
    total: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      loading: false,
      searchKeyword: ''
    };
  },
  computed: {
    filteredSuppliers() {
      return this.supplierList;
    },
    hasSearchKeyword() {
      return this.searchKeyword.trim() !== '';
    }
  },
  methods: {
    doSearch() {
      // 将搜索关键字传递给父组件
      this.$emit('search', this.searchKeyword);
    },
    
    clearSearch() {
      this.searchKeyword = '';
      this.doSearch();
    },
    
    handleCreate() {
      this.$emit('create');
    },
    
    handleEdit(row) {
      this.$emit('edit', row);
    },
    
    handleDelete(id) {
      this.$confirm('确定要删除该供应商吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$emit('delete', id);
      }).catch(() => {});
    }
  }
}
</script>

<style scoped>
.supplier-list {
  position: relative;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.search-section {
  margin-bottom: 20px;
  display: flex;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

.search-input ::v-deep .el-input__inner {
  border-radius: 20px;
  padding-right: 60px;
}

.search-input ::v-deep .el-input-group__append {
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
  background: #409EFF;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.search-input ::v-deep .el-input-group__append:hover {
  background: #66b1ff;
}

.search-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.search-result {
  font-size: 14px;
}

.highlight {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}

.supplier-table-container {
  min-height: 400px;
}

.supplier-table {
  border-radius: 8px;
  overflow: hidden;
}

.supplier-name {
  font-weight: 600;
}

.contact-info,
.phone-info,
.address-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-supplier-btn {
  position: absolute;
  right: 40px;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.add-supplier-btn .el-button {
  width: 50px;
  height: 50px;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.btn-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #409EFF;
  font-weight: 500;
}
</style>