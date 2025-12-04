import { InputField } from '@segment/actions-core'

export const trackRevenuePerProduct: InputField = {
    label: 'Track Revenue Per Product',
    description:
      'When enabled, track revenue with each product within the event. When disabled, track total revenue once for the event.',
    type: 'boolean',
    default: false
}