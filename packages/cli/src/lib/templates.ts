import fs from 'fs-extra'
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
  } else {
    fs.mkdirSync(targetDir)
  }

  let files: string[]
  if (fs.statSync(templatePath).isFile()) {
    files = [templatePath]
  } else {
    files = fs.readdirSync(templatePath)
  }

  for (const file of files) {
    const template = fs.readFileSync(path.join(templatePath, file), 'utf8')
    const contents = renderTemplate(template, data)
    const writePath = path.join(targetDir, file)
    fs.writeFileSync(writePath, contents, 'utf8')
  }
}
