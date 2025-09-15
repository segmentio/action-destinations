import { transformCart } from '../transformFields/transformCart'
import { transformCommonFields } from '../transformFields/transformCommonFields'
import { transformCustomer } from '../transformFields/transformCustomer'
import { transformSearch } from '../transformFields/transformSearch'
import { Payload } from './generated-types'

export function transformPayload(payload: Payload) {
  const commonFields = transformCommonFields(payload)

  const result = {
    ...commonFields,
    data: {
      ...commonFields.data,
      ...transformCart(payload),
      ...transformCustomer(payload),
      ...transformSearch(payload)
    }
  }

  return result
}
