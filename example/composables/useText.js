// 通过import json 和 const nuxtApp = useNuxtApp() 获取当前语言

export const useText = () => {
  const a = "分光光度"
  const b = ()=>{
    return "辅导费不放过"
  }
  return `测试${a}复苏非得${b()}`
}
