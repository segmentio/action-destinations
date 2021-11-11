export interface Person {
  name: string
  email: string
}

export async function createOrUpdatePersonById(id: number | null, person: Person, request: any, settings: any): Promise<void> {
  if (!id) {
    await request(`https://${settings.domain}.pipedrive.com/api/v1/persons`, {
      method: 'post',
      json: person
    })
  }

  await request(`https://${settings.domain}.pipedrive.com/api/v1/persons/${personId}`, {
    method: 'put',
    json: person
  })
}
