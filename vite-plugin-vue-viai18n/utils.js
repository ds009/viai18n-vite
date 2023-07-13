const esprima = require('esprima');
const htmlparser = require('htmlparser2') // high performance according to https://github.com/fb55/htmlparser2
const md5 = require('blueimp-md5')
const fs = require('fs')

function getFileName(resourcePath) {
  const paths = resourcePath.split('/')
  const file = paths[paths.length - 1]
  return file.slice(0, file.lastIndexOf('.'))
}

function removeQuotes(text) {
  return text.match(/^(\s*)['"](.*)['"](\s*)$/)[2]
}

function generateScriptReplacers(script, matchRegex, transMethod) {
  const tokens = esprima.tokenize(script)
  const replacers = []
  const targets = {}
  tokens.filter(node => (node.type === 'Template' || node.type === 'String')).forEach(node => {
    // match result !== target text
    const matched = node.value.match(new RegExp(matchRegex))
    if (matched) {
      if (node.type === 'String') {
        // node.value has already quotes here
        if (!targets[node.value]) {
          targets[node.value] = true
          const origin = trimText(removeQuotes(node.value))
          const hash = getTextKey(origin)
          const newText = `${transMethod}("${hash}","${origin}")`
          replacers.push({oldText: new RegExp(regSafeText(node.value), 'g'), newText, origin, hash, isScript:true})
        }
      } else {
        // Template

          const groups = node.value.match(/^([`}])([\s\S]*)((\${)|`)/)
          if (groups && groups.length > 3) {
            const origin = trimText(groups[2])
            const hash = getTextKey(origin)
            const newText = groups[1] + '${'+transMethod+'("' + hash + '","'+origin+'")}' + groups[3]
            replacers.push({oldText: node.value, newText, origin, hash, isScript:true})

          } else {
            console.error('Error when retrieving text from script template: ' + node.value)
            throw new Error('Syntax incompatible')
          }

      }
    }
  })
  return replacers
}

function generateTemplateReplacers(template, matchRegex,  transMethod='$t') {
  let replacers = []
  const parser = new htmlparser.Parser({
    onattribute(name, text) {
      const targetReg = new RegExp(matchRegex)
      const matched = text.match(targetReg)
      if (matched) {
        const tokenInExpression = text.split(/("[\s\S]*?")|('[\s\S]*?')/)
        if (tokenInExpression.length > 1) {
          let newText = ''
          tokenInExpression.forEach(token => {
            if (!token) {
              return
            }
            const matchToken = token.match(targetReg)
            if (matchToken) {
              const origin = trimText(removeQuotes(token))
              const hash = getTextKey(origin)
              // quotes in same type quotes cause bugs
              if(token[0]==='\''){
                newText += transMethod+"('" + hash + "')"
              }else{
                newText += transMethod+'("' + hash + '")'
              }
              replacers.push({origin, hash})
            } else {
              newText += token
            }
          })
          replacers.push({oldText: text, newText})
        } else {
          const origin = trimText(text)
          const hash = getTextKey(origin)
          const oldTextReg = name + '\\s*=\\s*(\'|")' + regSafeText(text) + '(\'|")'
          const newText = nameAsVariable(name) + '=\''+transMethod+'("' + hash + '")\''
          replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})
        }
      }
    },
    ontext(text) {
      replacers = replacers.concat(parseExpressionInTemplate(text, matchRegex, transMethod))
    }
  },{lowerCaseAttributeNames:false})
  parser.write(template)
  parser.end()
  return replacers
}

function parseExpressionInTemplate(text, matchRegex, transMethod='$t') {
  const replacers = []
  const targetReg = new RegExp(matchRegex)
  const matched = text.match(targetReg)
  if (matched) {
    const matchExp = text.match(/{{([\s\S]*)}}/)
    if (matchExp) {
      // split text by {{}} expression
      const tokens = text.split(/({{[\s\S]*?}})/)
      let newText = ''
      tokens.forEach(t => {
        if (!t) {
          return
        }
        const matchStr = t.match(targetReg)
        if (matchStr) {
          if (t[0] !== '{') {
            // simple text in template
            const origin = trimText(t) // the whole text but not only matched, because it may be a mix of different languages
            const hash = getTextKey(origin)
            newText += '{{'+transMethod+'("' + hash + '")}}'
            replacers.push({origin, hash})// replace entire text once
          } else {
            const tokenInExpression = t.split(/("[\s\S]*?")|('[\s\S]*?')/)
            tokenInExpression.forEach(token => {
              if (!token) {
                return
              }
              const matchToken = token.match(targetReg)
              if (matchToken) {
                const origin = trimText(removeQuotes(token))
                const hash = getTextKey(origin)
                // quotes in same type quotes cause bugs
                if(token[0]==='\''){
                  newText += transMethod+"('" + hash + "')"
                }else{
                  newText += transMethod+'("' + hash + '")'
                }
                replacers.push({origin, hash})
              } else {
                newText += token
              }
            })
          }
        }
        else {
          newText += t
        }
      });
      replacers.push({oldText: text, newText})
    } else {
      const origin = trimText(text)
      const hash = getTextKey(origin)
      const oldTextReg = '>\\s*' + regSafeText(text) + '\\s*<'
      const newText = '>{{'+transMethod+'("' + hash + '")}}<'
      replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})
    }
  }
  return replacers
}

function regSafeText(text) {
  return text.replace(/\*/g, '\\*').replace(/\./g, '\\.')
    .replace(/\+/g, '\\+').replace(/\^/g, '\\^')
    .replace(/\[/g, '\\[').replace(/\]/g, '\\]')
    .replace(/\?/g, '\\?').replace(/\$/g, '\\$')
    .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    .replace(/\|/g, '\\|')
}

function nameAsVariable(name) {
  return name.indexOf(':') === 0 ? name : (':' + name)
}

function trimText(text) {
  return text.trim().replace(/(^\s+)|(^\s+)/g, ' ')
}

function getTextKey(text) { // 8 chars text with 4 chars hash should be enough
  const trimed = text.replace(/[\s\r\n]/g, '')
  const textKey = trimed.slice(0, 8)

  //  八个首字符+hash
  return trimed.length > 8 ? `${textKey}_${md5(text).slice(0, 4)}` : textKey
}

function createJsonIfNotExist(filePath){
  try {
    fs.openSync(filePath,'r');
  }catch (e){
    fs.writeFileSync(filePath, '{}');
  }
}

function syncJsonFile(data, filePath, defaultLang) {
  let result = data;
  try {
    const file = fs.readFileSync(filePath)
    const oldData = JSON.parse(file)
    const oldKeys = Object.keys(oldData[defaultLang]).sort()
    const newData = Object.assign({}, data)
    const newKeys = Object.keys(newData[defaultLang]).sort()
    if (JSON.stringify(oldKeys) === JSON.stringify(newKeys)){
      // key 没有变化 不用写文件
      return
    }

    // assign old data, merge with new data, only two levels
    Object.keys(oldData).forEach(lang => {
      if (!newData[lang]) {
        // keep all oldData when a lang is not presented in newData
        newData[lang] = oldData[lang]
      } else {
        Object.keys(newData[lang]).forEach(k => {
          if (oldData[lang][k] !== undefined) {
            // old text may be translated already, copy its value
            newData[lang][k] = oldData[lang][k]
          }
        })
      }
    })
    result = newData
  } catch (e) {}
  writeDataAsJson(filePath, result)
}

function writeDataAsJson (filePath, data){
  fs.writeFileSync(filePath, JSON.stringify(sortObjectByKey(data), null, 4), {flag: 'w'})
}

function sortObjectByKey(unordered) {
  const ordered = {};
  Object.keys(unordered).sort().forEach(function (key) {
    if (typeof unordered[key] === 'string') {
      ordered[key] = unordered[key];
    } else {
      ordered[key] = sortObjectByKey(unordered[key]);
    }
  });
  return ordered
}

function insertMessages(filename, transMethod) {
  // disable viai18n to prevent repeating the process
  return `
    /* viai18n-disable */
    import ${transMethod}Messages from "./${filename}.messages.json";
  `
}

function getTransMethodString(defaultLang, transMethod) {
  // messages put in computed so that languages shown can be switched without refresh the page
  return `
    ${transMethod}(key){
      const lang = this.$lang.value || '${defaultLang}';
      const messages = ${transMethod}Messages[lang] || ${transMethod}Messages['${defaultLang}'] || {};
      return messages[key]===undefined?key:messages[key];
    },
  `
}
function getComposableTransMethodString(defaultLang, transMethod) {
  return `
    const ${transMethod} = (key) => {
      const nuxtApp = useNuxtApp();
      const lang = nuxtApp.$lang.value || '${defaultLang}';
      console.log(lang,'ddd');
      const messages = ${transMethod}Messages[lang] || ${transMethod}Messages['${defaultLang}'] || {};
      return messages[key]===undefined?key:messages[key];
    }
  `
}
function insertTransMethod(filename, defaultLang, source, transMethod) {

  const insertString = insertMessages(filename, transMethod)
  const [script, isComposable] = matchScript(source)
  if (script) {
    if(isComposable) {
      return source.replace(script[1], ()=>script[1] + insertString + getComposableTransMethodString(defaultLang, transMethod))
    }
    // 兼容旧代码
    const defaultObject = matchDefaultObject(script[2]) // script body
    // use function returned string to avoid '$' replacement bug
    if(!defaultObject) return source;
    const messageProp = getTransMethodString(defaultLang, transMethod);
    const simpleExport = 'export default { methods:{' + messageProp + '} }'
    // the original default may have different forms, we proxy it here by adding $t method
    const modifiedExport = `
      if ($defaultObject.methods){
        Object.assign($defaultObject.methods,{${messageProp}})
      }else{
        $defaultObject.methods = {${messageProp}}
      }
      export default $defaultObject
    `

    // use function returned string to avoid '$' replacement bug
    return source.replace(defaultObject[0], ()=>insertString + 'const $defaultObject = ' + defaultObject[2] + '\n' + modifiedExport)

  } else {
    // no script
    return source + '<script setup>' + insertString + getComposableTransMethodString(defaultLang, transMethod) + '</script>'
  }
}

function insertComposableTransMethod(filename, defaultLang, source, transMethod) {
  const messageProp = getComposableTransMethodString(defaultLang, transMethod);
  const insertString =  insertMessages(filename,transMethod)
  const result = insertString + messageProp + source
  return result;
}

function matchTemplate(source) {
  const matched = source.match(/<template>([\s\S]*)<\/template>/)
  return matched
}

function matchDefaultObject(source) {
  const matched = source.match(/(export\s+default\s*)([\s\S]+)/)
  return matched
}

function matchScript(source) {
  const matched = source.match(/([\s\S]*?<script[^>]*>)([\s\S]*)(<\/script>[\s\S]*)/)
  return [matched, /<script[^>]*setup>/.test(source)]
}

function removeComments(source) {
  let sourceWithoutComment = source.replace(/<!--[\s\S]*?-->/igm, '')
  // remove comments in template, esprima.tokenize will ignore comments in js
  return sourceWithoutComment
}

module.exports = {
  getFileName,
  generateScriptReplacers,
  generateTemplateReplacers,
  syncJsonFile,
  createJsonIfNotExist,
  insertTransMethod,
  insertComposableTransMethod,
  matchTemplate,
  matchScript,
  removeComments,
}
