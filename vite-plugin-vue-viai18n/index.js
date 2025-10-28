import { createFilter } from '@rollup/pluginutils';
import processI18n from "./processI18n";
import {chineseRegex} from "./utils";

const fileRegex = /((\.vue)|(\/composables\/.*\.js))$/

export default function vitePluginVueViai18n(options) {
  if (!options.languages || !options.languages.length) {
    // languages must be set
    throw new Error('no languages are given in options')
  }
  const filter = createFilter(null, [/(node_modules)|(\.nuxt)/].concat(options.exclude||[]));
  return {
    name: 'replace-i18n-text',
    enforce: 'pre',
    transform(src, fileId, viteOption) {
      //  vite会加很多查询字符串 要先去掉
      const qIndex = fileId.indexOf('?');
      const id = qIndex>0?fileId.slice(0,qIndex):fileId;

      if (!filter(id)) return;
      if (!fileRegex.test(id)) return;
      if(/\/\*\s+viai18n-disable\s+\*\//.test(src)) {
        return;
      }

      // use regString to find targets
      const matchRegex = options.regex || chineseRegex

      if (!matchRegex.test(src)) return;
      // ssr: true 的时候不需要重复写json文件
      const updateJSON = process.env.I18N === 'true' && !(viteOption?.ssr === true)
      // npm run generate 的时候会updateJSON
      const result = processI18n(src.slice(), id , options.languages, matchRegex, updateJSON, options.compress)
      return {
        code: result,
        map: null,
      }
    },
  }
}
