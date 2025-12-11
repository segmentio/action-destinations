import { LDU, UserData, Options, ActionSource, FBClient, FBStandardEventType, FBNonStandardEventType } from '../types'
import { US_STATE_CODES, COUNTRY_CODES} from './constants'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { getNotVisibleForEvent } from './depends-on'
import { omit } from '@segment/actions-core'

export function send(client: FBClient, payload: Payload, settings: Settings) {
    const { pixelId } = settings
    const { 
        event_config: { custom_event_name, show_fields, event_name } = {},
        ...rest
    } = omit(payload, ['eventID', 'eventSourceUrl', 'actionSource', 'userData'])

    const isCustom = event_name === 'CustomEvent' ? true : false

    if(isCustom && !validate(payload)){
        return
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

    const options = buildOptions(payload)
    
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

export function validate(payload: Payload): boolean {
    const { 
        event_config: { event_name },
        content_ids,
        contents
    } = payload

    if(['AddToCart', 'Purchase', 'ViewContent'].includes(event_name)){
        if(content_ids?.length === 0 || contents?.length === 0) {
            console.warn(`content_ids or contents are required for event ${event_name}`)
            return false
        }
    }

    return true
}

export function getLDU(ldu: keyof typeof LDU) {
    const lduObj = LDU[ldu]
    return { country: lduObj.country, state: lduObj.state }
}

export function buildOptions(payload: Payload): Options | undefined {
    const { eventID, eventSourceUrl, actionSource, userData } = payload    
    
    const sanitizedUserData = santizeUserData(userData as UserData) 

    const options: Options = { 
        eventID,
        eventSourceUrl,
        ...(actionSource ? { actionSource: actionSource as ActionSource } : {}),
        ...(sanitizedUserData ? { userData: sanitizedUserData } : {})
    }

    return Object.values(options).some(Boolean) ? options : undefined
}

export function santizeUserData(userData: UserData): UserData | undefined {
    if(!userData){
        return undefined 
    }

    const { external_id, em, ph, fn, ln, ge, db, ct, st, zp, country } = userData

    const formattedExternalId = external_id ?? undefined
    const formattedEm = typeof em === 'string' ? em.toLowerCase().trim() : undefined
    const formattedPh = ph ? ph.replace(/\D/g, '') : undefined
    const formattedFn = fn ? sanitiseUtf8String(fn) : undefined
    const formattedLn = ln ? sanitiseUtf8String(ln) : undefined
    const formattedGe = ge === 'f' || ge === 'm' ? ge : undefined
    const formattedDb = formatDate(db)
    const formattedCt = ct ? sanitiseUtf8String(ct) : undefined
    const formattedSt = st ? sanitizeState(st) : undefined
    const formattedZp = zp ? sanitiseUtf8String(zp) : undefined
    const formattedCountry = country ? sanitizeCountry(country) : undefined

    const ud: UserData = {
        ...(formattedExternalId ? {external_id: formattedExternalId} : {}),
        ...(formattedEm ? {em: formattedEm} : {}),
        ...(formattedPh ? {ph: formattedPh} : {}),
        ...(formattedFn ? {fn: formattedFn} : {}),
        ...(formattedLn ? {ln: formattedLn} : {}),
        ...(formattedGe ? {ge: formattedGe} : {}),
        ...(formattedDb ? {db: formattedDb} : {}),
        ...(formattedCt ? {ct: formattedCt} : {}),
        ...(formattedSt ? {st: formattedSt} : {}),
        ...(formattedZp ? {zp: formattedZp} : {}),
        ...(formattedCountry ? {country: formattedCountry} : {})
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

function sanitizeState(state?: string): string | undefined {
    if (typeof state !== 'string' || !state.trim()) {
        return undefined
    }

    const normalized = sanitiseUtf8String(state)

    if (!normalized) {
        return undefined
    }

    const abbreviation = US_STATE_CODES.get(normalized)
    if (abbreviation) {
        return abbreviation
    } else 
    {
        return normalized
    }
}

function sanitizeCountry(country?: string): string | undefined {
    if (typeof country !== 'string' || !country.trim()) {
        return undefined
    }

    const normalized = sanitiseUtf8String(country)

    if(!normalized){
        return undefined
    }

    const abbreviation = COUNTRY_CODES.get(normalized)
    if (abbreviation) {
        return abbreviation
    } else {
        return normalized
    }
}

function sanitiseUtf8String(stringValue?: string): string | undefined {
    if (!stringValue) {
        return undefined
    }
    // Remove all non-letter characters using Unicode property escapes
    return stringValue
        .toLowerCase()
        .replace(/[^\p{L}]/gu, '')
}