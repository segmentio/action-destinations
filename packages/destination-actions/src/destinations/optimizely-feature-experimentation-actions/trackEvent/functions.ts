import { RequestClient } from '@segment/actions-core'
import { ProjectConfig, CacheFields } from '../types'
import { CacheEntryStates } from '../utils'
import type { Settings } from '../generated-types'
import type { LruCache } from '@segment/actions-core/src/destination-kit'

export async function getDatafileFieldsToCache(dataFile: ProjectConfig) {
  return {
    events: dataFile.events,
    attributes: dataFile.attributes,
    botFiltering: dataFile.botFiltering,
    accountId: dataFile.accountId,
    anonymizeIP: dataFile.anonymizeIP
  }
}

export async function getDatafile(settings: Settings, request: RequestClient, lruCache?: LruCache) {
  let dataFileJSON
  const { dataFileUrl } = settings

  const exp = (settings.cacheExp || 300) * 1000 // seconds to milliseconds

  const cacheKey = dataFileUrl
  let cacheEntry = <CacheFields>lruCache?.getCache(cacheKey)

  if (!isCacheReady(cacheEntry, exp)) {
    if (!cacheEntry) {
      cacheEntry = { state: CacheEntryStates.STATE_UPDATING }
    }

    try {
      dataFileJSON = await loadDatafile(dataFileUrl, cacheEntry, request)
      cacheEntry.date = new Date()
      cacheEntry.state = CacheEntryStates.STATE_UPDATED
    } catch (e) {
      cacheEntry.state = CacheEntryStates.STATE_FAILED
      throw e
    }

    lruCache?.setCache(cacheKey, cacheEntry)
  }

  try {
    if (typeof dataFileJSON === 'string') {
      dataFileJSON = JSON.parse(dataFileJSON)
    }
    return dataFileJSON
  } catch (e) {
    const err = new Error(`Could not parse datafile ${dataFileUrl}. Please ensure the file is a valid JSON file.`)
    throw err
  }
}

async function loadDatafile(dataFileUrl: string, cacheEntry: CacheFields, request: RequestClient) {
  let res
  if (cacheEntry.date) {
    res = await request<ProjectConfig>(dataFileUrl, {
      headers: {
        'If-Modified-Since': cacheEntry.date.toUTCString()
      },
      throwHttpErrors: true
    })
    if (res.status === 304) {
      return cacheEntry.dataFile
    }
  } else {
    res = await request<ProjectConfig>(dataFileUrl)
  }

  const data = res.data
  const fieldsToCache = await getDatafileFieldsToCache(data)
  cacheEntry.dataFile = fieldsToCache

  return fieldsToCache
}

function isCacheReady(cacheEntry: CacheFields, ttl: number) {
  if (!cacheEntry || cacheEntry.state === CacheEntryStates.STATE_FAILED) {
    return false
  }
  if (cacheEntry.state === CacheEntryStates.STATE_UPDATED && cacheEntry.date) {
    return cacheEntry.date.getTime() + ttl >= Date.now()
  }
  // state is either STATE_VALIDATING, STATE_UPDATING
  return true
}
