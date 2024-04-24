import { InputField } from '@segment/actions-core/index'
import { discountApplicationDefaultFields, discountApplicationProperties } from '../properties/discount-application'

export const checkoutDiscountApplications: InputField = {
  type: 'object',
  multiple: true,
  label: 'Checkout Discount Applications',
  description: 'A list of discount applications associated with the checkout.',
  properties: discountApplicationProperties
}

export const checkoutDiscountApplicationsDefault = {
  '@arrayPath': ['$.properties.checkout.discountApplications', discountApplicationDefaultFields()]
}
