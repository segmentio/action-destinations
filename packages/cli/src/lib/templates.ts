import fs from 'fs-extra'
import globby from 'globby'
import { Liquid as LiquidJs } from 'liquidjs'
import path from 'path'

const Liquid = new LiquidJs()

export async function renderTemplate(template: string, data?: object) {
  return Liquid.parseAndRender(template, data)
}

export async function renderTemplates(templatePath: string, targetDir: string, data: object = {}, force?: boolean) {
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
    const contents = await renderTemplate(template, data)
    fs.writeFileSync(file, contents, 'utf8')
    const renderedFile = await renderTemplate(file, data)

    if (file !== renderedFile) {
      fs.renameSync(file, renderedFile)
    }
  }
}
