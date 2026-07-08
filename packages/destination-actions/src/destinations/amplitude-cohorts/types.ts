import { ID_TYPES, OPERATIONS } from './constants'

export type Region = 'north_america' | 'europe'

export type CreateAudienceJSON = {
  name: string // Cohort Name
  app_id: string // Amplitude App ID
  id_type: 'BY_USER_ID' // Device ID not supported by Amplitude Cohorts. Only BY_USER_ID is supported when creating a cohort.
  cg?: string // Cohort Grouping
  ids: Array<string> // List of User IDs or Amplitude IDs. Must contain at least one User ID to create the cohort.
  owner: string // Cohort owner. The login email of the user who will own the cohort in Amplitude
  published: true // Whether the cohort should be published immediately
}

export type CreateAudienceResponse = {
  cohortId: string
}

export type GetAudienceResponse = {
  cohort_id: string
  request_id: string
}

export type IDType = keyof typeof ID_TYPES

export type Operation = keyof typeof OPERATIONS

export type MembershipIdType = 'BY_NAME' | 'BY_AMP_ID'

export type UploadToCohortJSON = {
  cohort_id: string
  skip_invalid_ids: true
  memberships: Array<{
    ids: Array<string>
    id_type: MembershipIdType
    operation: Operation
  }>
}

export type UserSearchResponse = {
  matches: Array<{
    user_id?: string | null
    amplitude_id?: number
    [key: string]: unknown
  }>
}
