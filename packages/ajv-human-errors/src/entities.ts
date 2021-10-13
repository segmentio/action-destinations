import type { ErrorObject } from 'ajv'

export type FieldLabels = 'instancePath' | 'js' | 'jsonPath' | 'jsonPointer' | 'title'

export interface Options {
  fieldLabels?: FieldLabels
  includeOriginalError?: boolean
  includeData?: boolean
}

export interface HumanError {
  path: string
  pointer: string
  message: string
  original?: ErrorObject
  data?: ErrorObject['data']
}
