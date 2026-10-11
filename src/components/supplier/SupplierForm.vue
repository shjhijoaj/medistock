<template>
  <el-form :model="supplier" :rules="rules" ref="supplierForm" label-width="100px">
    <el-form-item label="供应商名称" prop="name">
      <el-input v-model="supplier.name" placeholder="请输入供应商名称"></el-input>
    </el-form-item>
    
    <el-form-item label="联系人" prop="contact">
      <el-input v-model="supplier.contact" placeholder="请输入联系人姓名"></el-input>
    </el-form-item>
    
    <el-form-item label="联系电话" prop="phone">
      <el-input v-model="supplier.phone" placeholder="请输入联系电话"></el-input>
    </el-form-item>
    
    <el-form-item label="联系地址" prop="address">
      <el-input v-model="supplier.address" placeholder="请输入联系地址"></el-input>
    </el-form-item>
    
    <el-form-item label="备注信息" prop="remark">
      <el-input
        type="textarea"
        :rows="3"
        v-model="supplier.remark"
        placeholder="请输入备注信息"
      ></el-input>
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  props: {
    supplierData: {
      type: Object,
      default: () => ({
        id: null,
        name: '',
        contact: '',
        phone: '',
        address: '',
        remark: ''
      })
    }
  },
  data() {
    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback(new Error('联系电话不能为空'));
      } else if (!/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号'));
      } else {
        callback();
      }
    };
    
    return {
      supplier: { ...this.supplierData },
      rules: {
        name: [
          { required: true, message: '供应商名称不能为空', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        contact: [
          { required: true, message: '联系人不能为空', trigger: 'blur' }
        ],
        phone: [
          { required: true, validator: validatePhone, trigger: 'blur' }
        ],
        address: [
          { required: true, message: '联系地址不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    supplierData: {
      deep: true,
      handler(newVal) {
        this.supplier = { ...newVal };
      }
    }
  },
  methods: {
    submitForm() {
      this.$refs.supplierForm.validate(valid => {
        if (valid) {
          this.$emit('submit', this.supplier);
        } else {
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.supplierForm.resetFields();
    }
  }
}
</script>