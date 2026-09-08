export function formatAttributes(attributes: { [k: string]: unknown }) {
  const formattedAttributes: { [k: string]: unknown } = {}
  for (const key in attributes) {
    formattedAttributes[`segment.${key}`] = attributes[key]
  }
  return formattedAttributes
}

export function sanitiseEventName(name: string) {
  return 'segment.' + name
}
