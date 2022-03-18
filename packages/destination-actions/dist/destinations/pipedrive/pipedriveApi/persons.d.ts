import { ModifiedResponse } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'
export interface Person {
  name?: string
  email?: string[]
  phone?: string[]
  add_time?: string
  visible_to?: number
}
export declare function createOrUpdatePersonById(
  request: RequestClient,
  domain: string,
  personId: number | null,
  person: Person
): Promise<ModifiedResponse<void>>
