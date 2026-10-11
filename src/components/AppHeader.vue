<template>
  <header class="app-header">
    <div class="logo-container">
      <img :src="require('@/assets/logo.png')" alt="Logo" class="logo">
      <h1 class="app-title">医院药品进销存系统</h1>
    </div>
    
    <div class="user-section">
      <el-dropdown trigger="click">
        <span class="user-info">
          <el-avatar icon="el-icon-user-solid" size="medium"></el-avatar>
          <span class="user-name">管理员</span>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item icon="el-icon-user">个人中心</el-dropdown-item>
          <el-dropdown-item icon="el-icon-setting">系统设置</el-dropdown-item>
          <el-dropdown-item divided icon="el-icon-switch-button" @click.native="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  methods: {
    logout() {
      this.$confirm('确定要退出系统吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 实际项目中这里应该调用 logout API
        this.$router.push('/login');
        this.$message.success('您已成功退出系统');
      }).catch(() => {
        this.$message.info('已取消退出操作');
      });
    }
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo-container {
  display: flex;
  align-items: center;
  height: 100%;
}

.logo {
  height: 40px;
  width: 40px;
  margin-right: 10px;
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.user-section {
  display: flex;
  align-items: center;
  height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 100%;
  padding: 0 10px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-name {
  margin: 0 5px;
  font-size: 14px;
}
</style>