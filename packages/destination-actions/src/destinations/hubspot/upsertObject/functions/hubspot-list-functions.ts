import { Client } from '../client'
import { ReadListsResp, ReadListsReq, ReadObjectSchemaResp, CachableList } from '../types'
import { StatsContext, RetryableError, PayloadValidationError } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { getListFromCache, saveListToCache } from '../functions/cache-functions'
import { HubSpotError } from '../../errors'


export async function ensureList(client: Client, objectType: string, name?: string, subscriptionMetadata?: SubscriptionMetadata, statsContext?: StatsContext): Promise<CachableList | undefined> {
  if(!name) {
    return undefined
  }

  let cacheableList = getListFromCache(name, objectType, subscriptionMetadata, statsContext)

  if(cacheableList){
    return cacheableList
  } else {
    cacheableList = await getListFromHubspot(client, name, objectType) 

    if(!cacheableList) {
      cacheableList = await createListInHubspot(client, name, objectType)
    }
    
    if (cacheableList) {
      await saveListToCache(cacheableList, subscriptionMetadata, statsContext)
      return cacheableList
    }
  }
  throw new PayloadValidationError(`Failed to ensure list with name ${name} in HubSpot`)
}

async function getListFromHubspot(client: Client, listName: string, objectType: string): Promise<CachableList | undefined> {
  try{
    const response = await client.readList(listName)
    const { listId, name, objectTypeId, processingTypes } = response?.data?.list
    if (processingTypes != "MANUAL") {
      return undefined
    }
    else {
      return {
        listId,
        name,
        objectType,
        objectTypeId
      }
    }
  } catch (err) {
    return undefined  
  }
}


async function createListInHubspot(client: Client, name: string, objectType: string): Promise<CachableList | undefined> {
  try{
    const response = await client.createList({
      name,
      objectTypeId: objectType,
      processingType: "MANUAL"
    })
    if(response?.data.list){
      const { listId, name, objectTypeId } = response.data.list
      return {
        listId,
        name,
        objectType: objectType,
        objectTypeId
      }
    }
    return undefined
  }
  catch(err){
    if((err as HubSpotError)?.response?.data?.subCategory === 'ILS.DUPLICATE_LIST_NAMES'){
      throw new RetryableError('Failed to create list: a list with this name already exists.')
    }
    throw err
  }
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