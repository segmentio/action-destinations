import { ModifiedResponse } from "@segment/actions-core";
import type { RequestClient } from "@segment/actions-core"

export interface Activity {
  subject?: string;
  type?: string,
  public_description?: string,
  note?: string,
  due_date?: string,
  due_time?: string,
  duration?: string,
  done?: boolean | number,
  deal_id?: number,
  person_id?: number,
  org_id?: number,
}

export async function createActivity(
  request: RequestClient,
  domain: string,
  activity: Activity,
): Promise<ModifiedResponse<void>> {
  activity.done = activity.done ? 1 : 0; // convert to integer, if it's boolean
  return request(`https://${domain}.pipedrive.com/api/v1/activities`, {
    method: 'post',
    json: activity
  })
}
