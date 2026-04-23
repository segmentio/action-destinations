export type MergeUsersJSON = {
  identifier_to_merge: {
    // Only one of the following
    external_id?: string
    user_alias?: {
      alias_label: string
      alias_name: string
    }
    email?: string
    phone?: string
    previousIdPrioritization?: string
  }
  identifier_to_keep: {
    // Only one of the following
    external_id?: string
    user_alias?: {
      alias_label: string
      alias_name: string
    }
    email?: string
    phone?: string
    keepIdPrioritization?: string
  }
}

export type MergeIdentifierType = 'external_id' | 'user_alias' | 'email' | 'phone'
