export interface UserAlias {
  alias_name: string
  alias_label: string
}

export interface CohortChanges {
  user_ids?: Set<string>
  device_ids?: Set<string>
  aliases?: Set<UserAlias>
  should_remove?: boolean
}
