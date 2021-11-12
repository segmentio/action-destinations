import { RequestClient } from "@segment/actions-core/src/create-request-client"

export interface Deal {
  title: string;

  value?: string,
  currency?: string,
  stage_id?: number,
  status?: string,
  expected_close_date?: string,
  probability?: number,
  lost_reason?: string,
  visible_to?: number,
  add_time?: string,

  person_id?: number,
  org_id?: number,
}

export async function createDeal(
  request: RequestClient,
  domain: string,
  deal: Deal,
): Promise<void> {
  await request(`https://${domain}.pipedrive.com/api/v1/deals`, {
    method: 'post',
    json: deal
  })
}
