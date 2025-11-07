import { Payload } from './generated-types'
import { SCHEMA_TYPES } from './constants'

export interface PayloadWithIndex extends Payload {
  index: number
}

export interface OperationType {
  method: 'POST' | 'DELETE'
  type: SchemaType
}

export interface AddRemoveUsersJSON {
  users: [
    {
      schema: ['EMAIL_SHA256'] | ['PHONE_SHA256'] | ['MOBILE_AD_ID_SHA256']
      data: [string][]
    }
  ]
}

export type SchemaType = typeof SCHEMA_TYPES[keyof typeof SCHEMA_TYPES]
