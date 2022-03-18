interface UserAlias {
  alias_name: string
  alias_label: string
}
export declare function isValidUserAlias(userAlias: unknown): userAlias is UserAlias
export declare function getUserAlias(alias: unknown): UserAlias | undefined
export {}
