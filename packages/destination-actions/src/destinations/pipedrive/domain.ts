export interface PipedriveFields {
  data: PipedriveField[],
  additional_data: {
    pagination: {
      next_start?: number
    }
  }
}

export interface PipedriveField {
  name: string,
  key: string
}
