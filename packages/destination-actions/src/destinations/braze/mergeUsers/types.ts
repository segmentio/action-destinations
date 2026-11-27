import type { UserAlias } from '../userAlias'

export type MergeUsersJSON = {
  merge_updates: Array<MergeUsersItem>
}

export type MergeUsersItem = {
  identifier_to_merge: {
    // Only one of the following
    external_id?: string
    user_alias?: UserAlias
    email?: string
    phone?: string
    prioritization?: Prioritization
  }
  identifier_to_keep: {
    // Only one of the following
    external_id?: string
    user_alias?: UserAlias
    email?: string
    phone?: string
    prioritization?: Prioritization
  }
}

export type Prioritization =
  | ['identified']
  | ['unidentified']
  | ['most_recently_updated']
  | ['least_recently_updated']
  | ['identified', 'most_recently_updated']
  | ['unidentified', 'most_recently_updated']
  | ['identified', 'least_recently_updated']
  | ['unidentified', 'least_recently_updated']

export type MergeIdentifierType = 'external_id' | 'user_alias' | 'email' | 'phone'
