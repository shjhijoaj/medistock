<template>
  <el-form :model="medicine" :rules="rules" ref="medicineForm" label-width="100px">
    <el-form-item label="药品名称" prop="name">
      <el-input v-model="medicine.name" placeholder="请输入药品全称"></el-input>
    </el-form-item>
    
    <el-row>
      <el-col :span="12">
        <el-form-item label="品牌" prop="brand">
          <el-input v-model="medicine.brand" placeholder="品牌名称"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="规格" prop="spec">
          <el-input v-model="medicine.spec" placeholder="如：10mg*20片"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-row>
      <el-col :span="12">
        <el-form-item label="批号" prop="batch">
          <el-input v-model="medicine.batch" placeholder="药品批号"></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="最低库存" prop="minStock">
          <el-input-number v-model="medicine.minStock" :min="1" :max="999"></el-input-number>
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-row>
      <el-col :span="12">
        <el-form-item label="有效期至" prop="expiryDate">
          <el-date-picker
            v-model="medicine.expiryDate"
            type="date"
            placeholder="选择有效期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="仓库位置" prop="location">
          <el-input v-model="medicine.location" placeholder="仓库位置编号"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-form-item label="用药说明" prop="usage">
      <el-input
        v-model="medicine.usage"
        type="textarea"
        :rows="3"
        placeholder="用法用量、注意事项等"
      ></el-input>
    </el-form-item>
    
    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="medicine.remark"
        type="textarea"
        :rows="2"
        placeholder="其他说明信息"
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
    medicineData: {
      type: Object,
      default: () => ({
        id: null,
        name: '',
        brand: '',
        spec: '',
        batch: '',
        minStock: 10,
        expiryDate: '',
        location: '',
        usage: '',
        remark: ''
      })
    }
  },
  data() {
    return {
      medicine: { ...this.medicineData },
      rules: {
        name: [
          { required: true, message: '药品名称不能为空', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        spec: [
          { required: true, message: '规格不能为空', trigger: 'blur' }
        ],
        batch: [
          { required: true, message: '批号不能为空', trigger: 'blur' }
        ],
        minStock: [
          { required: true, message: '请设置最低库存', trigger: 'blur' }
        ],
        expiryDate: [
          { required: true, message: '请选择有效期', trigger: 'change' }
        ],
        location: [
          { required: true, message: '仓库位置不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    medicineData: {
      deep: true,
      handler(newVal) {
        this.medicine = { ...newVal }
      }
    }
  },
  methods: {
    submitForm() {
      this.$refs.medicineForm.validate(valid => {
        if (valid) {
          this.$emit('submit', this.medicine);
        } else {
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.medicineForm.resetFields();
    }
  }
}
</script>