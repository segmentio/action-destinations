export interface Profile {
  user_id?: string
  anonymous_id?: string
  email?: string
  traits: Record<string, string>
}
