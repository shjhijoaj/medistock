import Vue from 'vue'
import Router from 'vue-router'
import LayoutApp from '@/components/LayoutApp'
import DashboardView from '@/views/DashboardView'
import InboundView from '@/views/InboundView'
import OutboundView from '@/views/OutboundView'
import InventoryView from '@/views/InventoryView'
import SettingsView from '@/views/SettingsView'
import MedicineView from '@/views/MedicineView'
import SupplierView from '@/views/SupplierView'
import MedicineList from '@/components/medicine/MedicineList'
import MedicineForm from '@/components/medicine/MedicineForm'
import SupplierList from '@/components/supplier/SupplierList'
import SupplierForm from '@/components/supplier/SupplierForm'
import InventoryReport from '@/components/report/InventoryReport'
import TransactionReport from '@/components/report/TransactionReport'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: LayoutApp,
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: DashboardView,
          meta: { title: '系统概览' }
        },
        {
          path: '/medicine',
          component: MedicineView,
          redirect: '/medicine/list',
          children: [
            {
              path: 'list',
              component: MedicineList,
              meta: { title: '药品列表' }
            },
            {
              path: 'new',
              component: MedicineForm,
              meta: { title: '新增药品' }
            },
            {
              path: 'edit/:id',
              component: MedicineForm,
              meta: { title: '编辑药品' }
            }
          ]
        },
        {
          path: '/inbound',
          name: 'Inbound',
          component: InboundView,
          meta: { title: '药品入库' }
        },
        {
          path: '/outbound',
          name: 'Outbound',
          component: OutboundView,
          meta: { title: '药品出库' }
        },
        {
          path: '/inventory',
          name: 'Inventory',
          component: InventoryView,
          meta: { title: '库存管理' }
        },
        {
          path: '/supplier',
          component: SupplierView,
          redirect: '/supplier/list',
          children: [
            {
              path: 'list',
              component: SupplierList,
              meta: { title: '供应商列表' }
            },
            {
              path: 'new',
              component: SupplierForm,
              meta: { title: '新增供应商' }
            },
            {
              path: 'edit/:id',
              component: SupplierForm,
              meta: { title: '编辑供应商' }
            }
          ]
        },
        {
          path: '/inventory-report',
          name: 'InventoryReport',
          component: InventoryReport,
          meta: { title: '库存报表' }
        },
        {
          path: '/transaction-report',
          name: 'TransactionReport',
          component: TransactionReport,
          meta: { title: '交易报表' }
        },
        {
          path: '/settings',
          name: 'Settings',
          component: SettingsView,
          meta: { title: '系统设置' }
        }
      ]
    }
  ]
})