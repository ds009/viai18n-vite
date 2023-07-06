<template>
  <div  class="flex justify-between p-4 shadow-md">
    <div>多语言插件测试demo</div>
    <div>sd挡挡风</div>
    <div class="text-red-500">{{ $lang.value  }}</div>
    <el-dropdown @command="setLang">
        <el-button type="primary">
          {{ currentLangText }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="locale in availableLocales" :key="locale.value" :command="locale.value" >{{ locale.text }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
  </div>
</template>

<script>
  // nuxt2 旧代码兼容测试
  import { useI18nStore } from '~/stores/i18n'
  import { storeToRefs } from 'pinia'
  export default {
    setup(){
      const i18nStore = useI18nStore()
      return {
        ...storeToRefs(i18nStore),
        setLang: i18nStore.setLang
      }
    },
    data() {
      return {
        nothing: false,
      }
    }
  }
</script>
