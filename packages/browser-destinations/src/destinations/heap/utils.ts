export function isDefined(value: string | undefined | null | number | object): boolean {
  if (typeof value === 'object') {
    return !!value && Object.keys(value).length !== 0
  }
  return !(value === undefined || value === null || value === '' || value === 0 || value === '0')
}
