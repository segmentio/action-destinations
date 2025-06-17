export interface BatchEvent {
  event: string
  properties: {
    [key: string]: unknown
    distinct_id: string
    $process_person_profile: boolean
  }
  timestamp?: string | number
}

export interface BatchPageEvent extends BatchEvent {
  event: "$pageview"
  properties: BatchEvent["properties"] & {
    "$current_url": string
  }
}

export interface BatchScreenEvent extends BatchEvent {
  event: "$screen"
  properties: BatchEvent["properties"] & {
    "$screen_name": string
  }
}


export interface BatchJSON {
  api_key: string
  historical_migration?: boolean
  batch: (BatchEvent | BatchPageEvent | BatchScreenEvent)[]
}

export interface IdentifyEvent {
  api_key: string
  event: '$identify'
  distinct_id: string
  properties: {
    $set: {
      [key: string]: unknown
    }
  }
  timestamp?: string | number
}