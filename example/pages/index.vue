<template>
  <div class="page-index">
    <Header></Header>
    <div class="p-4">
      <h1 class="mt-2">测试三个地方韩发过火发过火发过火国护肤</h1>
      <p title="一段中文">{{testConst}}</p>
      <p class="my-4">{{showMessage}}</p>
      <el-tag v-for="tag in testReactive.texts" :key="tag">{{ tag }}</el-tag>

      <div class="row-item input-item my-4">
        <el-input v-model="testRef" placeholder="输入链接"  />
        {{testRef}}
      </div>
      <el-button :plain="true" @click="open">Show message</el-button>
    </div>

  </div>
</template>

<script setup>
  import Header from '../components/Header'
  import { ref, reactive, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  const open = () => {
    ElMessage('弹出消息')
  }
  const testReactive = reactive({
    name: '那个谁',
    texts: [
      '测试1',
      '测试2',
      'testaaaa'
    ]
  })
  const testConst = "常量"
  const showMessage = computed(() => {
    return testReactive.texts.length > 0 ? '展示' : '隐藏'
  })
  const testRef = ref('测试ref')
</script>
