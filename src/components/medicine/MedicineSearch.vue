<template>
  <div class="medicine-search">
    <el-input
      v-model="searchQuery"
      placeholder="输入药品名称或批号搜索"
      clearable
      style="width: 300px;"
      @input="handleSearch"
    />
    <el-button 
      type="primary" 
      icon="el-icon-search" 
      @click="handleSearch"
    >
      搜索
    </el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: ''
    }
  },
  methods: {
    handleSearch() {
      this.$emit('search', this.searchQuery);
    }
  }
}
</script>

<style scoped>
.medicine-search {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.el-button {
  margin-left: 10px;
}
</style>