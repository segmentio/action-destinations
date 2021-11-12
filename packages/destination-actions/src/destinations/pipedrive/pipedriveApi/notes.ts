import { ModifiedResponse } from "@segment/actions-core"
import type { RequestClient } from "@segment/actions-core"

export interface Note {
  content: string;
  add_time?: string
  deal_id?: number,
  lead_id?: number,
  person_id?: number,
  org_id?: number,
}

export async function createNote(
  request: RequestClient,
  domain: string,
  note: Note,
): Promise<ModifiedResponse<void>> {
  return request(`https://${domain}.pipedrive.com/api/v1/notes`, {
    method: 'post',
    json: note
  })
}
