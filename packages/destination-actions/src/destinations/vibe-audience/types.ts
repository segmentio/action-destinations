export interface RequestJSON {
  audienceId: string
  audienceName: string
  addProfiles: Profile[]
  removeProfiles: Profile[]
}

export interface Profile {
  email: string
  profileDetails?: {
    first_name?: string
    last_name?: string
    phone?: string
  }
}
