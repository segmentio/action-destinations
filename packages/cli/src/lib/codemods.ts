import jscodeshift from 'jscodeshift'
import addImports from 'jscodeshift-add-imports'
import prettier from 'prettier'

const j = jscodeshift.withParser('ts')
const { statement } = j.template

const prettierOptions = prettier.resolveConfig.sync(process.cwd())

export function format(code: string): string {
  return prettier.format(code, { parser: 'typescript', ...prettierOptions })
}

/**
 * Modifies a property of the default export with a new key
 */
export function addKeyToExport(code: string, exportName: string, property: string, variableName: string) {
  const root = j(code)

  const newProperty = j.property.from({
    kind: 'init',
    key: j.identifier(variableName),
    value: j.identifier(variableName),
    shorthand: true
  })

  const defaultExport = root.find(j.ExportDefaultDeclaration)
  if (!defaultExport.length && exportName === 'default') {
    throw new Error('Could not parse "default" export.')
  }

  const namedExport = root.find(j.ExportNamedDeclaration, {
    declaration: {
      type: 'VariableDeclaration',
      declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: exportName } }]
    }
  })
  if (!namedExport.length && exportName !== 'default') {
    throw new Error(`Could not parse "${exportName}" export.`)
  }

  let objectToModify = (exportName === 'default' ? defaultExport : namedExport).get().node.declaration
  if (objectToModify.type !== 'ObjectExpression') {
    // We need to find the original variable to modify
    const exportedVar = root.find(j.VariableDeclaration, {
      declarations: [{ id: { type: 'Identifier', name: objectToModify.name ?? exportName } }]
    })
    if (!exportedVar.length) {
      throw new Error('Unable to find exported variable to modify.')
    }

    objectToModify = exportedVar.get().node.declarations[0].init
  }

  if (objectToModify.type !== 'ObjectExpression') {
    throw new Error(`Invalid export type: "${objectToModify.type}"`)
  }

  // Make sure the object doesn't already have the property
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
  const existingProperty = objectToModify.properties.find((props: any) => props.key.name === property)
  if (existingProperty) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    if (!existingProperty.value.properties.find((props: any) => props.key.name === variableName)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      existingProperty.value.properties.push(newProperty)
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    objectToModify.properties.push(j.property('init', j.identifier(property), j.objectExpression([newProperty])))
  }

  const importStatement = `import ${variableName} from './${variableName}'`
  addImports(root, [statement([importStatement])])

  return format(root.toSource())
}
