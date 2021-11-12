import { RequestClient } from "@segment/actions-core/src/create-request-client"

export interface Organization {
  name?: string
  add_time?: string
}

export async function createOrUpdateOrganizationById(
  request: RequestClient,
  domain: string,
  organizationId: number | null,
  organiztion: Organization,
): Promise<void> {
  if (organizationId) {
    // Update an organization
    await request(`https://${domain}.pipedrive.com/api/v1/organizations/${organizationId}`, {
      method: 'put',
      json: organiztion
    })
  } else {
    // Create an organization
    await request(`https://${domain}.pipedrive.com/api/v1/organizations`, {
      method: 'post',
      json: organiztion
    })
  }
}
