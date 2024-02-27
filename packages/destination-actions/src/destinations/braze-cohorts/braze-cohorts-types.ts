export interface UserAlias {
  alias_name: string
  alias_label: string
}

export interface CohortChanges {
  user_ids?: Array<string>
  device_ids?: Array<string>
  aliases?: Array<UserAlias>
  should_remove?: boolean
}
