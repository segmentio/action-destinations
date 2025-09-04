import { Client } from '../client'
import { ReadListsResp, ReadListsReq, ReadObjectSchemaResp, CreateListReq, CreateListResp} from '../types'
import { PayloadWithFromId } from '../types'
import { ModifiedResponse } from '@segment/actions-core'

export async function createListsPayloads(client: Client, payloads: PayloadWithFromId[], objectType: string): Promise<CreateListReq[]> {
  const payloadsLists = payloadListNames(payloads, 'lists_add')
  const hubspotLists = await getLists(client)
  const missingLists = payloadsLists.filter(name => !hubspotLists.some(l => l.name === name))
  return missingLists.map(name => ({
    name,
    objectTypeId: objectType,
    processingType: "MANUAL"
  }))
}

async function createLists(client: Client, missingLists: string[]): Promise<ModifiedResponse<CreateListResp>[]> {
  const requests = missingLists.map(async (name) => {
    return client.createList({
      name,
      objectTypeId: client.objectType,
      processingType: "MANUAL"
    })
  })
  return await Promise.all(requests)
}

function payloadListNames(payloads: PayloadWithFromId[], key: 'lists_add' | 'lists_remove'): string[] {
  return [
    ...new Set(
      payloads.flatMap((p) =>
        p[key]?.map((l) => l.list_name.trim()) || []
      )
    )
  ]  
}

export async function getLists(client: Client): Promise<ReadListsResp['lists']> {
    const objectTypeId = (await readObjectSchema(client)).objectTypeId
    const allLists = await readLists(client)
    return allLists.filter(item => item.processingType === "MANUAL" && item.objectTypeId === objectTypeId)
}

export async function readLists(client: Client): Promise<ReadListsResp['lists']> {
    const json: ReadListsReq = {
        processingTypes: ["MANUAL"]
    }
  
    let allLists: ReadListsResp['lists'] = []
    let hasMore = true
    let offset: number | undefined = undefined

    while (hasMore) {
      if (offset !== undefined) {
        json.offset = offset
      }

      const response = await client.readLists(json)

      allLists = [...allLists, ...response.data.lists]
      hasMore = response.data.hasMore
      offset = response.data.offset
    }
    
    return allLists
}

export async function readObjectSchema(client: Client): Promise<ReadObjectSchemaResp> {
  const response = await client.readObjectSchema()
  return response.data
}