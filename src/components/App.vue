<template>
  <div class="app-container">
    <app-header />
    <div class="main-layout">
      <app-sidebar />
      <div class="content-area">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import AppHeader from '@/components/Header.vue'
import AppSidebar from '@/components/Sidebar.vue'

export default {
  name: 'LayoutApp',
  components: {
    AppHeader,
    AppSidebar
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>