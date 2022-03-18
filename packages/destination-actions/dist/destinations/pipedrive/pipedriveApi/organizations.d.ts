import { ModifiedResponse } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'
export interface Organization {
  name?: string
  add_time?: string
  visible_to?: number
}
export declare function createOrUpdateOrganizationById(
  request: RequestClient,
  domain: string,
  organizationId: number | null,
  organization: Organization
): Promise<ModifiedResponse<void>>
