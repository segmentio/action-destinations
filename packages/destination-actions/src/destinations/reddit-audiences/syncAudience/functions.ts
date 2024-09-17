import { IntegrationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { AudienceSettings } from '@segment/actions-core/destination-kit'
import { Payload } from '../syncAudience/generated-types'
import { Settings } from '../generated-types'

import { createHash } from 'crypto'



export async function send(request: RequestClient, payloads: Payload[], settings: Settings, audienceSettings: AudienceSettings) {
  const audienceId = payloads[0].external_audience_id
  
  if(!audienceId) {
    throw new PayloadValidationError('External Audience ID is required.')
  }

}



function checkHash(value: string): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

function hashEmail(value: string): string {
  const email = canonicalizeEmail(value)
  const hash = createHash('sha256')
  hash.update(email)
  return hash.digest('hex')
}

function canonicalizeEmail(value: string): string {
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart}@${localPartAndDomain[1].toLowerCase()}`
}