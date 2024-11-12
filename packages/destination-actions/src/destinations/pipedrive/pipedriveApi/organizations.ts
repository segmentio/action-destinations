import { ModifiedResponse } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'

export interface Organization {
  name?: string
  add_time?: string
  visible_to?: string
}

export async function createOrUpdateOrganizationById(
  request: RequestClient,
  domain: string,
  organizationId: number | null,
  organization: Organization
): Promise<ModifiedResponse<void>> {
  if (organizationId) {
    // Update an organization
    return request(`https://${domain}.pipedrive.com/api/v1/organizations/${organizationId}`, {
      method: 'put',
      json: organization
    })
  } else {
    // Create an organization
    return request(`https://${domain}.pipedrive.com/api/v1/organizations`, {
      method: 'post',
      json: organization
    })
  }
}
