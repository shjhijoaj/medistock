<template>
  <div class="app-container">
    <app-header />
    <div class="main-layout">
      <app-sidebar />
      <div class="content-area">
        <div class="content-header">
          <el-breadcrumb separator-class="el-icon-arrow-right">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">
              <span class="breadcrumb-icon"><i class="el-icon-s-home"></i> 首页</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item>
              <span class="breadcrumb-title">{{ $route.meta.title || '页面' }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
          <h1 class="page-title">
            <i v-if="$route.meta.icon" :class="[$route.meta.icon, 'title-icon']"></i>
            {{ $route.meta.title || '页面标题' }}
          </h1>
        </div>
        <div class="content-body">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

export default {
  name: 'LayoutApp',
  components: {
    AppHeader,
    AppSidebar
  },
  mounted() {
    this.updateTitle();
    document.body.style.setProperty('--primary-color', '#409EFF');
  },
  watch: {
    $route() {
      this.updateTitle();
    }
  },
  methods: {
    updateTitle() {
      const title = this.$route.meta.title;
      document.title = title ? `${title} - 药品进销存系统` : '药品进销存系统';
      
      // 更新主色调
      const color = this.$route.meta.color || '#409EFF';
      document.body.style.setProperty('--primary-color', color);
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  font-family: 'Microsoft YaHei', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8fafc;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #f0f4f8;
}

.content-header {
  padding: 18px 24px 12px;
  background: linear-gradient(to right, var(--primary-color), #66b1ff);
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  z-index: 10;
  transition: all 0.3s ease;
}

.breadcrumb-icon {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
}

.breadcrumb-title {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.page-title {
  margin: 12px 0;
  font-size: 22px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
}

.title-icon {
  margin-right: 12px;
  font-size: 26px;
  animation: pulse 2s infinite;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f5f7fa;
  transition: all 0.3s ease;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0, 0.1, 1);
}
.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media screen and (max-width: 768px) {
  .content-header {
    padding: 12px 16px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .content-body {
    padding: 16px;
  }
}
</style>