import { createHash } from 'crypto'
import { ConversionCustomVariable } from './uploadClickConversion/types'

export function formatCustomVariables(
  customVariables: object | undefined,
  customVariableIdsResults: Array<ConversionCustomVariable>
): object | undefined {
  if (!customVariables) {
    return undefined
  }

  // map custom variable names to resource name
  const resourceNames: { [key: string]: any } = {}
  Object.entries(customVariableIdsResults).forEach(([_, customVariables]) => {
    resourceNames[customVariables.conversionCustomVariable.name] = customVariables.conversionCustomVariable.resourceName
  })

  const variables: { conversionCustomVariable: string; value: string }[] = []
  Object.entries(customVariables).forEach(([key, value]) => {
    if (resourceNames[key] != undefined) {
      const variable = {
        conversionCustomVariable: resourceNames[key],
        value: value
      }
      variables.push(variable)
    }
  })

  return variables
}

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}
