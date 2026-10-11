<template>
  <div class="settings-view">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-setting"></i> 系统设置
      </h2>
    </div>
    
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="数据备份与恢复" name="backup">
        <el-card class="backup-card">
          <div class="backup-actions">
            <el-button 
              type="primary" 
              icon="el-icon-download"
              @click="createBackup"
              :loading="backupLoading"
            >
              创建数据备份
            </el-button>
            
            <el-upload
              action=""
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-change="handleImport"
              accept=".json"
              style="display: inline-block; margin-left: 15px"
            >
              <el-button 
                type="success" 
                icon="el-icon-upload2"
              >
                导入备份文件
              </el-button>
            </el-upload>
            
            <div class="stats-info">
              <div>最后备份时间: {{ lastBackupTime }}</div>
              <div>最后恢复时间: {{ lastRestoreTime }}</div>
              <div>当前数据: 
                药品({{ dataStats.medicineCount }}) | 
                供应商({{ dataStats.supplierCount }}) | 
                入库记录({{ dataStats.inboundCount }}) | 
                出库记录({{ dataStats.outboundCount }})
              </div>
            </div>
          </div>
          
          <el-divider></el-divider>
          
          <div class="history-section">
            <h3 class="section-title">
              <i class="el-icon-time"></i> 备份历史记录
            </h3>
            
            <el-table 
              :data="backupHistories" 
              border 
              stripe 
              empty-text="暂无备份记录"
              style="width:100%"
            >
              <el-table-column prop="timestamp" label="备份时间" width="180" sortable />
              <el-table-column label="操作" width="250" align="center">
                <template slot-scope="scope">
                  <el-button 
                    size="mini" 
                    icon="el-icon-refresh" 
                    @click="restoreData(scope.row.data)"
                  >
                    恢复数据
                  </el-button>
                  <el-button 
                    size="mini" 
                    icon="el-icon-download" 
                    @click="exportBackup(scope.row.timestamp)"
                  >
                    导出
                  </el-button>
                  <el-button 
                    size="mini" 
                    icon="el-icon-delete" 
                    type="danger"
                    @click="deleteBackup(scope.row.timestamp)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>
      
      <el-tab-pane label="系统信息" name="info">
        <el-card>
          <h3 style="margin-top: 0">系统信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统名称">药品库存管理系统</el-descriptions-item>
            <el-descriptions-item label="当前版本">v2.0.0</el-descriptions-item>
            <el-descriptions-item label="开发团队">技术开发部</el-descriptions-item>
            <el-descriptions-item label="联系方式">tech@example.com</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { ElMessage, ElMessageBox } from 'element-ui';

export default {
  name: 'SettingsView',
  meta: {
    title: '系统设置'
  },
  data() {
    return {
      activeTab: 'backup',
      backupLoading: false
    };
  },
  computed: {
    ...mapGetters('medicine', [
      'backupHistories',
      'lastBackupTime',
      'lastRestoreTime',
      'dataStatistics'
    ]),
    
    dataStats() {
      return this.dataStatistics || {
        medicineCount: 0,
        supplierCount: 0,
        inboundCount: 0,
        outboundCount: 0
      };
    }
  },
  methods: {
    ...mapActions('medicine', [
      'createBackup',
      'restoreData',
      'deleteBackup',
      'exportBackup',
      'importBackup'
    ]),
    
    beforeUpload(file) {
      const isJSON = file.type === 'application/json' || file.name.endsWith('.json');
      if (!isJSON) {
        ElMessage.error('请上传JSON格式的文件');
      }
      return isJSON;
    },
    
    handleImport(file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          
          // 验证导入数据格式
          if (data.medicines && data.suppliers && data.inboundRecords) {
            this.importBackup(data);
            ElMessage.success('备份文件导入成功');
          } else {
            ElMessage.error('备份文件格式不正确');
          }
        } catch (error) {
          ElMessage.error('解析备份文件失败');
          console.error('解析错误:', error);
        }
      };
      reader.readAsText(file.raw);
    },
    
    async createBackupLocal() {
      this.backupLoading = true;
      try {
        await this.createBackup();
        ElMessage.success('数据备份成功');
      } catch (error) {
        console.error('备份失败:', error);
        ElMessage.error('数据备份失败');
      } finally {
        this.backupLoading = false;
      }
    },
    
    restoreDataLocal(data) {
      ElMessageBox.confirm('此操作将覆盖当前所有数据，是否继续?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.restoreData(data);
        ElMessage.success('数据恢复成功');
        setTimeout(() => {
          location.reload(); // 刷新页面应用新数据
        }, 1000);
      }).catch(() => {});
    },
    
    exportBackupLocal(timestamp) {
      this.exportBackup(timestamp);
      ElMessage.success('备份文件导出成功');
    },
    
    deleteBackupLocal(timestamp) {
      ElMessageBox.confirm('此操作将永久删除该备份，是否继续?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteBackup(timestamp);
        ElMessage.success('备份已删除');
      }).catch(() => {});
    }
  }
}
</script>

<style scoped>
.settings-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
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

.backup-card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.backup-actions {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.stats-info {
  margin-left: 30px;
  font-size: 14px;
  color: #666;
}

.stats-info > div {
  margin-bottom: 5px;
}

.history-section {
  margin-top: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 8px;
}

.import-info {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.el-tabs {
  margin-top: 20px;
}
</style>