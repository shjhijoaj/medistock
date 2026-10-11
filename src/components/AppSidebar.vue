<template>
  <div class="sidebar-container" :class="{ 'sidebar-collapse': isCollapse }">
    <div class="sidebar-inner">
      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="toggleCollapse">
        <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
      </div>
      
      <!-- 侧边栏菜单 -->
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#fff"
        class="el-menu-vertical"
        :unique-opened="true"
      >
        <div class="logo-container" @click="navigateToDashboard">
          <div class="logo-icon">
            <i class="el-icon-first-aid-kit"></i>
          </div>
          <div class="logo-text" v-if="!isCollapse">
            药品进销存
          </div>
        </div>
        
        <!-- 菜单项 -->
        <el-menu-item index="/dashboard">
          <i class="el-icon-s-home menu-icon"></i>
          <span slot="title">系统概览</span>
          <div class="menu-highlight"></div>
        </el-menu-item>
        
        <el-menu-item index="/medicine">
          <i class="el-icon-notebook-2 menu-icon"></i>
          <span slot="title">药品列表</span>
          <div class="menu-highlight"></div>
        </el-menu-item>
        
        <!-- 添加的供应商管理菜单项 -->
        <el-menu-item index="/supplier">
          <i class="el-icon-s-shop menu-icon"></i>
          <span slot="title">供应商管理</span>
          <div class="menu-highlight"></div>
        </el-menu-item>
        
        <el-menu-item index="/inbound">
          <i class="el-icon-circle-plus menu-icon"></i>
          <span slot="title">药品入库</span>
          <div class="menu-highlight"></div>
        </el-menu-item>
        
        <el-menu-item index="/outbound">
          <i class="el-icon-upload2 menu-icon"></i>
          <span slot="title">药品出库</span>
          <div class="menu-highlight"></div>
        </el-menu-item>
        
        <el-menu-item index="/settings">
          <i class="el-icon-setting menu-icon"></i>
          <span slot="title">系统设置</span>
          <div class="menu-highlight"></div>
        </el-menu-item>
      </el-menu>
      
      <!-- 用户信息 -->
      <div class="user-info" @click="userDropdown = !userDropdown">
        <div class="user-avatar">
          <i class="el-icon-user-solid"></i>
        </div>
        <div class="user-details" v-if="!isCollapse">
          <div class="user-name">管理员</div>
          <div class="user-role">系统管理员</div>
        </div>
        <transition name="el-fade-in-linear">
          <div class="user-actions" v-show="userDropdown">
            <el-button 
              icon="el-icon-s-shop"
              class="supplier-action"
              @click.stop="navigateToSupplier"
            >
              管理供应商
            </el-button>
            <el-button 
              icon="el-icon-switch-button" 
              class="logout-action"
              @click.stop="logout"
            >
              退出系统
            </el-button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppSidebar',
  data() {
    return {
      isCollapse: false,
      userDropdown: false
    }
  },
  computed: {
    activeMenu() {
      return this.$route.path;
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse;
      // 当侧边栏收起时隐藏用户下拉菜单
      if (this.isCollapse) {
        this.userDropdown = false;
      }
    },
    navigateToDashboard() {
      if (this.$route.path !== '/dashboard') {
        this.$router.push('/dashboard');
      }
    },
    navigateToSupplier() {
      if (this.$route.path !== '/supplier') {
        this.$router.push('/supplier');
      }
      this.userDropdown = false;
    },
    logout() {
      this.$confirm('确定要退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'custom-logout-confirm'
      }).then(() => {
        this.$message.success('已成功退出系统');
        this.userDropdown = false;
      }).catch(() => {
        this.userDropdown = false;
      });
    },
    closeDropdown(e) {
      // 点击非下拉区域关闭菜单
      if (!this.$el.contains(e.target)) {
        this.userDropdown = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.closeDropdown);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeDropdown);
  }
}
</script>

<style scoped>
.sidebar-container {
  position: relative;
  height: 100vh;
  background: linear-gradient(145deg, #1f2d3d, #17212d);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collapse-btn {
  height: 48px;
  line-height: 48px;
  padding-left: 18px;
  font-size: 20px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
}

.collapse-btn i {
  transition: all 0.3s;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.collapse-btn:hover i {
  transform: scale(1.1);
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 240px;
}

.el-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s;
}

.logo-container {
  display: flex;
  align-items: center;
  height: 80px;
  padding: 0 24px;
  color: #fff;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2), transparent);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.logo-container:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.logo-container:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: var(--primary-color, #409EFF);
}

.logo-icon {
  font-size: 32px;
  color: #fff;
  margin-right: 15px;
  position: relative;
  z-index: 2;
}

.logo-text {
  margin-left: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.menu-icon {
  font-size: 20px;
  margin-right: 8px;
  vertical-align: middle;
  position: relative;
  z-index: 2;
}

.el-menu-item {
  height: 56px;
  line-height: 56px;
  font-size: 15px;
  position: relative;
  transition: all 0.3s;
  overflow: hidden;
  border-left: 3px solid transparent;
  padding-left: 24px !important;
}

.el-menu-item i {
  color: #a3b1c2;
  transition: color 0.3s;
}

.el-menu-item:hover, 
.el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2), transparent) !important;
  color: #fff !important;
  border-left: 3px solid var(--primary-color);
}

.el-menu-item:hover i, 
.el-menu-item.is-active i {
  color: #fff;
}

.menu-highlight {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.1), transparent);
  transition: left 0.6s;
}

.el-menu-item:hover .menu-highlight,
.el-menu-item.is-active .menu-highlight {
  left: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 16px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  min-height: 76px;
  flex-direction: column;
}

.user-info:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.user-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), #66b1ff);
  border-radius: 50%;
  font-size: 24px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: all 0.3s;
}

.user-info:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 14px rgba(0,0,0,0.3);
}

.user-details {
  margin-left: 12px;
  overflow: hidden;
  white-space: nowrap;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

.user-actions {
  position: absolute;
  bottom: 86px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  background-color: rgba(25, 35, 46, 0.95);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.user-actions::before {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 8px 0 8px;
  border-color: rgba(25, 35, 46, 0.95) transparent transparent transparent;
}

.user-actions button {
  width: 100%;
  justify-content: flex-start;
  height: 42px;
  font-weight: 500;
}

.supplier-action {
  background: linear-gradient(90deg, #409EFF, #66b1ff);
  color: white;
  border: none;
}

.supplier-action:hover {
  background: linear-gradient(90deg, #66b1ff, #a0cfff);
}

.logout-action {
  background-color: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
}

.logout-action:hover {
  background-color: rgba(245, 108, 108, 0.25);
  color: #ff7875;
}

.sidebar-collapse .user-details,
.sidebar-collapse .logo-text,
.sidebar-collapse .user-actions span {
  display: none;
}

@media screen and (max-width: 992px) {
  .sidebar-container {
    position: fixed;
    left: -240px;
    z-index: 1001;
  }
  
  .sidebar-container:not(.sidebar-collapse) {
    left: 0;
    box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
  }
  
  .user-actions {
    width: 200px;
    left: 20px;
    transform: none;
    bottom: 76px;
  }
}
</style>