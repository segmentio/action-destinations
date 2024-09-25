export interface Profile {
  user_id?: string
  anonymous_id?: string
  email?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  traits: Record<string, any>
}
