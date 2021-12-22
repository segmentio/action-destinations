export function getUserIdentifier(identifyByKey: string, identifyByValue: string): {} {
  return {
    [identifyByKey]: identifyByValue,
    identifyBy: [identifyByKey]
  }
}
