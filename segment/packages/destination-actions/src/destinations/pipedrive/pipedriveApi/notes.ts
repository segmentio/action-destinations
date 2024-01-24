import { ModifiedResponse } from '@segment/actions-core'
import PipedriveClient from './pipedrive-client'

export interface Note extends Record<string, unknown> {
  content: string
  add_time?: string
  deal_id?: number
  lead_id?: string
  person_id?: number
  org_id?: number
}

export async function createNote(client: PipedriveClient, note: Note): Promise<ModifiedResponse> {
  return client.createUpdate('notes', note)
}
