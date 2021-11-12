import { RequestClient } from "@segment/actions-core/src/create-request-client"

export interface Lead {
  title: string;

  // value?: string,
  expected_close_date?: string,
  visible_to?: number,

  person_id?: number,
  organization_id?: number,
}

export async function createLead(
  request: RequestClient,
  domain: string,
  lead: Lead,
): Promise<void> {
  await request(`https://${domain}.pipedrive.com/api/v1/leads`, {
    method: 'post',
    json: lead
  })
}
