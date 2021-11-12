import { RequestClient } from "@segment/actions-core/src/create-request-client"

export interface Person {
  name?: string
  email?: string[]
  phone?: string[]
  add_time?: string
}

export async function createOrUpdatePersonById(
  request: RequestClient,
  domain: string,
  personId: number | null,
  person: Person,
): Promise<void> {
  if (personId) {
    // Update a person
    await request(`https://${domain}.pipedrive.com/api/v1/persons/${personId}`, {
      method: 'put',
      json: person
    })
  } else {
    // Create a person
    await request(`https://${domain}.pipedrive.com/api/v1/persons`, {
      method: 'post',
      json: person
    })
  }
}
