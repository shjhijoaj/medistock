<template>
  <div class="medicine-view">
    <h2 class="page-title">药品管理</h2>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'MedicineView',
  meta: {
    title: '药品管理'
  }
}
</script>

<style scoped>
.medicine-view {
  padding: 20px;
}
</style>