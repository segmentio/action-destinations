import { ModifiedResponse } from '@segment/actions-core'
import PipedriveClient from './pipedrive-client'

export interface Lead extends Record<string, unknown> {
  title: string

  expected_close_date?: string
  visible_to?: number

  id?: number
  person_id?: number
  organization_id?: number
  add_time?: string
}

export async function createUpdateLead(client: PipedriveClient, lead: Lead): Promise<ModifiedResponse> {
  return client.createUpdate('leads', lead)
}
