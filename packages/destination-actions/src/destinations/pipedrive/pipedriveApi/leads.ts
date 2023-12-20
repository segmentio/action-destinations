import { ModifiedResponse } from '@segment/actions-core'
import PipedriveClient from './pipedrive-client'

export interface Lead extends Record<string, unknown> {
  title: string

  expected_close_date?: string
  visible_to?: string

  id?: string
  person_id?: number
  organization_id?: number
}

export type LeadValue = {
  amount?: number
  currency?: string
}

export async function createUpdateLead(client: PipedriveClient, lead: Lead): Promise<ModifiedResponse> {
  return client.createUpdate('leads', lead)
}
