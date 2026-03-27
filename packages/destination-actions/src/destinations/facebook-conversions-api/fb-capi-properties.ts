import { PayloadValidationError } from '@segment/actions-core'

// Implementation of the facebook pixel object properties.
// https://developers.facebook.com/docs/facebook-pixel/reference#object-properties
// Only implemented properties that are shared between more than one action.

type Content = {
  id?: string
  delivery_category?: string
}

export const validateContents = (contents: Content[]): PayloadValidationError | false => {
  const valid_delivery_categories = ['in_store', 'curbside', 'home_delivery']

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i]

    if (!item.id) {
      return new PayloadValidationError(`contents[${i}] must include an 'id' parameter.`)
    }

    if (item.delivery_category && !valid_delivery_categories.includes(item.delivery_category)) {
      return new PayloadValidationError(
        `contents[${i}].delivery_category must be one of {in_store, home_delivery, curbside}.`
      )
    }
  }

  return false
}

type DPOption = string[] | number

export const dataProcessingOptions = (
  data_processing_options: boolean | undefined,
  countryOption: number | undefined,
  stateOption: number | undefined
): DPOption[] => {
  if (data_processing_options) {
    const data_options = ['LDU']
    const country_code = countryOption ? countryOption : 0
    const state_code = stateOption ? stateOption : 0
    return [data_options, country_code, state_code]
  }
  return []
}