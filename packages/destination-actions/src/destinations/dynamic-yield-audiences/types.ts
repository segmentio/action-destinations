export type AudienceAction = 'ADD' | 'REMOVE'

export enum Priority {
  UserIdThenEmail = 'user_id_then_email',
  UserIdThenAnonymousId = 'user_id_then_anonymousId',
  UserIdThenEmailThenAnonymousId = 'user_id_then_email_then_anonymousId',
  UserIdOnly = 'user_id_only',
  EmailOnly = 'email_only'
}
