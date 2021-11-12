import { ModifiedResponse } from "@segment/actions-core"
import type { RequestClient } from "@segment/actions-core"

export interface Lead {
  title: string;

  expected_close_date?: string,
  visible_to?: number,

  person_id?: number,
  organization_id?: number,
}

export async function createLead(
  request: RequestClient,
  domain: string,
  lead: Lead,
): Promise<ModifiedResponse<void>> {
  return request(`https://${domain}.pipedrive.com/api/v1/leads`, {
    method: 'post',
    json: lead
  })
}
