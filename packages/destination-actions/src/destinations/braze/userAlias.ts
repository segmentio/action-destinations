interface UserAlias {
  alias_name: string
  alias_label: string
}

export function isValidUserAlias(userAlias: unknown): userAlias is UserAlias {
  if (userAlias && typeof userAlias === 'object' && userAlias.alias_label && userAlias.alias_name) {
    return true
  }

  return false
}

export function getUserAlias(alias: unknown): UserAlias | undefined {
  if (isValidUserAlias(alias)) {
    return {
      alias_label: alias.alias_label,
      alias_name: alias.alias_name
    }
  }

  return undefined
}