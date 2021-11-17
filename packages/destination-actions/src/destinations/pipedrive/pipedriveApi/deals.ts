import { ModifiedResponse } from '@segment/actions-core'
import PipedriveClient from './pipedrive-client'

export interface Deal extends Record<string, unknown> {
  title: string

  value?: string
  currency?: string
  stage_id?: number
  status?: string
  expected_close_date?: string
  probability?: number
  lost_reason?: string
  visible_to?: number
  add_time?: string

  id?: number
  person_id?: number
  org_id?: number
}

export async function createUpdateDeal(client: PipedriveClient, deal: Deal): Promise<ModifiedResponse> {
  return client.createUpdate('deals', deal)
}
