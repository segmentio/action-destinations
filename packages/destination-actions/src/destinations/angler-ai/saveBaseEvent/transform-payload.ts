import { transformCart } from '../transformFields/transformCart'
import { transformCommonFields } from '../transformFields/transformCommonFields'
import { transformCustomer } from '../transformFields/transformCustomer'
import { Payload } from './generated-types'

export function transformPayload(payload: Payload) {
  const commonFields = transformCommonFields(payload)

  const result = {
    ...commonFields,
    data: {
      ...commonFields.data,
      ...transformCustomer(payload),
      ...transformCart(payload)
    }
  }

  return result
}
