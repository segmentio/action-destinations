import { UserData, EventOptions, FBClient, FBStandardEventType, FBNonStandardEventType } from '../types'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { UniversalStorage, Analytics } from '@segment/analytics-next'
import {US_STATE_CODES, COUNTRY_CODES, MAX_INIT_COUNT, INIT_COUNT_KEY, USER_DATA_KEY } from '../constants'
import { storageFallback, setStorageInitCount } from '../functions'
import { getNotVisibleForEvent } from './depends-on'

export function send(client: FBClient, payload: Payload, settings: Settings, analytics: Analytics) {
    const { pixelId } = settings
    const { 
        event_config: { custom_event_name, show_fields, event_name } = {},
        eventID,
        eventSourceUrl,
        userData,
        ...rest
    } = payload

    const isCustom = event_name === 'CustomEvent' ? true : false

    if(isCustom){
        const errorMessage = validate(payload)
        if(errorMessage) {
          console.warn(`${errorMessage}`)
          return
        }
    }

    if(show_fields === false){
        // If show_fields is false we delete values for fields which are hidden in the UI. 
        const fieldsToDelete = getNotVisibleForEvent(event_name as FBStandardEventType | FBNonStandardEventType)
        fieldsToDelete.forEach(field => {
            if (field in rest) {
                delete rest[field as keyof typeof rest]
            }
        })
    }

    maybeSendUserData(client, payload, settings, analytics)

    const options = formatOptions(payload)
  
    if(isCustom){
      client(
        'trackSingleCustom', 
        pixelId,
        custom_event_name as string,
        { ...rest },
        options
      )
    } else {
      client(
        'trackSingle', 
        pixelId,
        event_name as FBStandardEventType,
        { ...rest },
        options
      )
    }
}

function validate(payload: Payload): string | undefined {
    const { 
        event_config: { event_name },
        content_ids,
        contents
    } = payload

    if(['AddToCart', 'Purchase', 'ViewContent'].includes(event_name)){
        if(content_ids?.length === 0 || contents?.length === 0) {
            return `content_ids or contents are required for event ${event_name}`
        }
    }

    return undefined
}

function formatOptions(payload: Payload): EventOptions | undefined {
    const { eventID, eventSourceUrl } = payload    
    const options: EventOptions = { 
        ...(eventID ? { eventID } : {}),
        ...(eventSourceUrl ? { eventSourceUrl } : {}),
    }
    return Object.values(options).some(Boolean) ? options : undefined
}

function maybeSendUserData(client: FBClient, payload: Payload, settings: Settings, analytics: Analytics) {
    const { pixelId } = settings
    const { userData } = payload
    const userDataFormatted = formatUserData(userData)

    if(userDataFormatted) {
        const storage = (analytics.storage as UniversalStorage<Record<string, string>>) ?? storageFallback
        const initCountFromStorage: string | null = storage.get(INIT_COUNT_KEY)
        const initCount: number | undefined = (initCountFromStorage && !isNaN(Number(initCountFromStorage))) 
            ? parseInt(initCountFromStorage, 10) 
            : undefined

        if(typeof initCount === 'number' && initCount < MAX_INIT_COUNT) {
            client('init', pixelId, userDataFormatted)
            setStorageInitCount(analytics, initCount + 1)
        }

        storage.set(USER_DATA_KEY, JSON.stringify(userDataFormatted))
    }
} 

function formatUserData(userData: Payload['userData']): UserData | undefined {
    if(!userData){
        return undefined 
    }

    const {
        external_id,
        em, 
        ph, 
        fn, 
        ln, 
        ge, 
        db, 
        ct, 
        st, 
        zp, 
        country
    } = userData

    const dbFormatted = formatDate(db)
    const stFormatted = formatState(st)
    const countryFormatted = formatCountry(country)

    const ud: UserData = {
        ...(typeof em === 'string' ? {em: em.toLowerCase().trim()} : {}), // lowercase and trim whitespace
        ...(typeof ph === 'string' ? {ph: ph.replace(/\D/g, '')} : {}), // remove non-numeric characters
        ...(typeof fn === 'string' ? {fn: fn.toLowerCase().trim()} : {}), // lowercase and trim whitespace
        ...(typeof ln === 'string' ? {ln: ln.toLowerCase().trim()} : {}), // lowercase and trim whitespace
        ...(typeof ge === 'string' ? {ge: ge.toLowerCase().trim()} : {}), // lowercase and trim whitespace
        ...(typeof dbFormatted === 'string' ? {db: dbFormatted} : {}), // format date to YYYYMMDD
        ...(typeof ct === 'string' ? {ct: ct.toLowerCase().replace(/\s+/g, '')} : {}), // lowercase and replace any whitespace
        ...(typeof stFormatted === 'string' ? {st: stFormatted} : {}), // lowercase 2 character state code 
        ...(typeof zp === 'string' ? {zp: zp.trim()} : {}),
        ...(typeof countryFormatted === 'string' ? {country: countryFormatted} : {}), // lowercase 2 character country code 
        ...(typeof external_id === 'string' ? {external_id} : {})
    }

    if(Object.keys(ud).length === 0){
        return undefined
    }
    return ud
}

function formatDate(isoDate?: string): string | undefined {
    if (!isoDate || typeof isoDate !== 'string') {
        return undefined
    }
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) {
        return undefined
    }
    const year = date.getUTCFullYear()
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = date.getUTCDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
}

function formatState(state?: string): string | undefined {
    if (typeof state !== 'string' || !state.trim()) {
        return undefined
    }

    const normalized = state.replace(/\s+/g, '').toLowerCase()

    const abbreviation = US_STATE_CODES.get(normalized)
    if (abbreviation) {
        return abbreviation
    }

    if (/^[a-z]{2}$/i.test(normalized)) {
        return normalized.toLowerCase()
    }

    return undefined
}

function formatCountry(country?: string): string | undefined {
    if (typeof country !== 'string' || !country.trim()) {
        return undefined
    }

    const normalized = country.replace(/\s+/g, '').toUpperCase()

    const abbreviation = COUNTRY_CODES.get(normalized)
    if (abbreviation) {
        return abbreviation
    }

    if (/^[A-Z]{2}$/.test(normalized)) {
        return normalized.toLowerCase()
    }

    return undefined
}