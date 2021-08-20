import fs from 'fs-extra'
import globby from 'globby'
import Mustache from 'mustache'
import path from 'path'

export function renderTemplate(template: string, data?: unknown) {
  return Mustache.render(template, data)
}

export function renderTemplates(templatePath: string, targetDir: string, data: unknown = {}, force?: boolean) {
  if (fs.existsSync(targetDir)) {
    if (!force && fs.readdirSync(targetDir).length > 0) {
      throw new Error(`There's already content in ${targetDir}. Exiting.`)
    }
  }

  let target = targetDir
  if (fs.statSync(templatePath).isFile()) {
    target = path.join(targetDir, templatePath)
  }

  fs.copySync(templatePath, target)
  const files = globby.sync(targetDir)

  for (const file of files) {
    const template = fs.readFileSync(file, 'utf8')
    const contents = renderTemplate(template, data)
    fs.writeFileSync(file, contents, 'utf8')
    const renderedFile = renderTemplate(file, data)
    if (file !== renderedFile) {
      fs.renameSync(file, renderedFile)
    }
  }
}
