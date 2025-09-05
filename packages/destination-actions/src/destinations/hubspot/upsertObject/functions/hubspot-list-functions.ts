import { Client } from '../client'
import { CachableList } from '../types'
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