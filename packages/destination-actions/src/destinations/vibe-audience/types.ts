export interface RequestJSON {
  advertiserId: string
  audienceId: string
  audienceName: string
  addProfiles: Profile[]
  removeProfiles: Profile[]
}

export interface Profile {
  email: string
  ip_address?: string
  profileDetails?: {
    first_name?: string
    last_name?: string
    phone?: string
  }
}
