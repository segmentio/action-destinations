import { ModifiedResponse } from '@segment/actions-core'
import PipedriveClient from './pipedrive-client'

export interface Activity extends Record<string, unknown> {
  id?: number
  subject?: string
  type?: string
  public_description?: string
  note?: string
  due_date?: string
  due_time?: string
  duration?: string
  done?: boolean | number
  deal_id?: number
  person_id?: number
  org_id?: number
}

export async function createUpdateActivity(client: PipedriveClient, activity: Activity): Promise<ModifiedResponse> {
  if (typeof activity.done !== 'undefined') {
    activity.done = activity.done ? 1 : 0 // convert to integer, if it's boolean
  }
  return client.createUpdate('activities', activity)
}
