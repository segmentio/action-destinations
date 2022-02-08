export interface UserIdentifier {
  [key: string]: string|string[]
  identifyBy: string[]
}

export function getUserIdentifier(identifyByKey: string, identifyByValue: string): UserIdentifier {
  return {
    [identifyByKey]: identifyByValue,
    identifyBy: [identifyByKey]
  }
}
