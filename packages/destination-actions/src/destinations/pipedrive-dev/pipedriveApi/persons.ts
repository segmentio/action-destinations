import { ModifiedResponse } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'

export interface Person {
  name?: string
  email?: string[]
  phone?: string[]
  add_time?: string
  visible_to?: number
}

export async function createOrUpdatePersonById(
  request: RequestClient,
  domain: string,
  personId: number | null,
  person: Person
): Promise<ModifiedResponse<void>> {
  if (personId) {
    // Update a person
    return request(`${domain}/api/v1/persons/${personId}`, {
      method: 'put',
      json: person
    })
  } else {
    // Create a person
    return request(`${domain}/api/v1/persons`, {
      method: 'post',
      json: person
    })
  }
}
