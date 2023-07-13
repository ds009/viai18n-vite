import utils from "./utils";

export default function processI18n (src, id, languages, matchRegex, updateJson) {
  const filename = utils.getFileName(id);
  const transMethod = '$V' +(filename.replace(/[^a-zA-Z]/g,'')||'text');
  let sourceWithoutComment = utils.removeComments(src);
  const filePath = id.match(/(.*)((\.vue$)|(\.js$))/);
  const jsonPath = filePath[1] + '.messages.json';
  let replacers = [];
  const replaceParts={}
  const isJS = filePath[2] === '.js'
  if(isJS) {
    replacers = utils.generateScriptReplacers(sourceWithoutComment, matchRegex, transMethod);
    replaceParts.parts = [sourceWithoutComment];
    replaceParts.scriptIndex = 0;
    replaceParts.script = sourceWithoutComment
  } else {
    // find template and script part
    const [matchScript, isComposable] = utils.matchScript(sourceWithoutComment)
    if (matchScript && matchScript[2]) {
      replaceParts.parts= matchScript.slice(1) // will be used to replace and reform the source code
      replaceParts.scriptIndex= 1
      replaceParts.script = replaceParts.parts[1] // will be used to find target texts and generate replacers
      // which part contains template
      const matchStart = utils.matchTemplate(replaceParts.parts[0])
      const matchEnd = utils.matchTemplate(replaceParts.parts[2])
      if(matchStart){
        replaceParts.templateIndex=0
        replaceParts.template = matchStart[0]
      }
      if(matchEnd){
        replaceParts.templateIndex=2
        replaceParts.template = matchEnd[0]
      }
    }else{
      const matchTemplate = utils.matchTemplate(sourceWithoutComment)
      if(matchTemplate){
        replaceParts.parts=[sourceWithoutComment]
        replaceParts.templateIndex=0
        replaceParts.template =matchTemplate[0]
      }
    }

    // get replacers from script and template

    if (replaceParts.script) {// the second group is script body
      replacers = replacers.concat(utils.generateScriptReplacers(
        replaceParts.script,
        matchRegex,
        (isComposable?'':'this.') + transMethod
      ))
    }
    if (replaceParts.template) {
      replacers = replacers.concat(utils.generateTemplateReplacers(replaceParts.template, matchRegex, transMethod))
    }
  }
  // replace old texts by new texts using regex
  if (replacers.length) {
    // only write json file when updateJson === true
    const data = {};
    languages.forEach(lang => {
      data[lang] = {}
    })
    replacers.forEach(replacer => {
      // replace source
      if (replacer.oldText) {
        const replaceIndex = replacer.isScript ? replaceParts.scriptIndex : replaceParts.templateIndex
        replaceParts.parts[replaceIndex] = replaceParts.parts[replaceIndex].replace(replacer.oldText, replacer.newText)
      }
      if (updateJson && replacer.hash) {
        // generate translations
        languages.forEach(lang => {
          data[lang][replacer.hash] = replacer.origin
        })
      }
    })
      // update messages file
    if (updateJson) utils.syncJsonFile(data, jsonPath, languages[0])


    // import messages
    // and insert $t (use default language if any language isn't found)
    const insertTransMethod = isJS ? utils.insertComposableTransMethod : utils.insertTransMethod;
    sourceWithoutComment = insertTransMethod(filename, languages[0], replaceParts.parts.join(''), transMethod)
  }
  return sourceWithoutComment
}
