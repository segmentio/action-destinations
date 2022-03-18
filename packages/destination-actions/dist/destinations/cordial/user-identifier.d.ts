export interface UserIdentifier {
  [key: string]: string | string[]
  identifyBy: string[]
}
export declare function getUserIdentifier(identifyByKey: string, identifyByValue: string): UserIdentifier
