export interface PipedriveFields {
  data: PipedriveField[]
  additional_data: {
    pagination: {
      next_start?: number
    }
  }
}

export interface PipedriveField {
  name: string
  key: string
}

export interface ActivityTypes {
  data: ActivityType[]
}

export interface ActivityType {
  name: string
  key_string: string
}
