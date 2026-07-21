import { Payload as IdentifyPayload } from '../identifyUser/generated-types'

/**
 * returns the transformed value by converting all spaces to '_' and converting everything to lower case
 */
export function sanitize(value: string) {
  return value.replace(/ /g, '_').toLowerCase()
}

/**
 * returns the cleaned props by removing the name, email and phone fields from the traits payload object for identify
 */
export function modifyProps(props?: IdentifyPayload['props']) {
  if (!props) return {}

  const mutatedProps: { [key: string]: unknown } = {}
  for (const key in props) {
    if (!['name', 'phone', 'email'].includes(key)) {
      mutatedProps[key] = props[key]
    }
  }

  return mutatedProps
}
