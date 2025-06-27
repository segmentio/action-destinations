import { LDU, UserData, Options, ActionSource } from './types'
import { US_STATE_CODES, COUNTRY_CODES} from './constants'
import { Payload } from './lead/generated-types'

export function getLDU(ldu: keyof typeof LDU) {
    const lduObj = LDU[ldu]
    return { country: lduObj.country, state: lduObj.state }
}

export function buildOptions(payload: Payload): Options | undefined {
  const { eventID, eventSourceUrl, actionSource, userData } = payload    
  
  const options: Options = { 
    eventID,
    eventSourceUrl,
    actionSource: actionSource as ActionSource | undefined,
    userData: santizeUserData(userData as UserData) 
  }

  return Object.values(options).some(Boolean) ? options : undefined
}

export function santizeUserData(userData: UserData): UserData | undefined {
    if(!userData){
        return undefined 
    }
    userData.em = typeof userData.em === 'string' ? userData.em.toLowerCase().trim() : undefined // lowercase and trim whitespace
    userData.ph = userData.ph ? userData.ph.replace(/\D/g, '') : undefined // remove non-numeric characters
    userData.fn = userData.fn ? userData.fn.toLowerCase().trim() : undefined // lowercase and trim whitespace
    userData.ln = userData.ln ? userData.ln.toLowerCase().trim() : undefined // lowercase and trim whitespace
    userData.ge = userData.ge ? userData.ge.toLowerCase().trim() : undefined // lowercase and trim whitespace
    userData.db = formatDate(userData.db) // format date to YYYYMMDD
    userData.ct = userData.ct ? userData.ct.toLowerCase().replace(/\s+/g, '') : undefined // lowercase and replace any whitespace
    userData.st = sanitizeState(userData.st) // lowercase 2 character state code 
    userData.zp = userData.zp ? userData.zp.trim() : undefined 
    userData.country = sanitizeCountry(userData.country) // lowercase 2 character country code 
    return userData
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

function sanitizeCountry(country?: string): string | undefined {
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