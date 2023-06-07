export default function cloneWithDefinedProps<O extends Record<string, unknown>, K extends keyof O>(
  object: O,
  props: K[] = []
) {
  return props.reduce((acc, prop) => {
    if (typeof object[prop] !== 'undefined') {
      acc[prop] = object[prop]
    }
    return acc
  }, {} as Pick<O, K>)
}
