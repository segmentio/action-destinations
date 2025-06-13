export interface BatchEvent {
  event: string
  properties: {
    [key: string]: unknown
    distinct_id: string
    $process_person_profile: boolean
  }
  timestamp?: string | number
}
