import { transformCart } from '../transformFields/transformCart'
import { transformCommonFields } from '../transformFields/transformCommonFields'
import { transformCustomer } from '../transformFields/transformCustomer'
import { transformProductVariant } from '../transformFields/transformProductVariant'
import { Payload } from './generated-types'

export function transformPayload(payload: Payload) {
  const commonFields = transformCommonFields(payload)

  const result = {
    ...commonFields,
    data: {
      ...commonFields.data,
      ...transformCart(payload),
      ...transformCustomer(payload),
      ...transformProductVariant(payload)
    }
  }

  return result
}
