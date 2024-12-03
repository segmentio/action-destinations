import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { use_responsys_async_api, batch_size, recipient_data, retry, folder_name } from '../shared-properties'
import { getUserDataFieldNames, testConditionsToRetry, validateListMemberPayload } from '../utils'
import { Data } from '../types'
import { sendToPet } from './functions'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send to PET (Profile Extension Table)',
  description: 'Send values to a Profile Extension Table in Responsys.',
  fields: {
    userData: { ...recipient_data, additionalProperties: true },
    folder_name: folder_name,
    pet_name: {
      label: 'Profile Extension Table Name',
      description:
        'The PET (Profile Extension Table) name. Overrides the default Profile Extension Table name in Settings.',
      type: 'string',
      required: false
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: false,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    use_responsys_async_api: use_responsys_async_api,
    batch_size: batch_size,
    stringify: {
      label: 'Stringify Recipient Data',
      description: 'If true, all Recipient data will be converted to strings before being sent to Responsys.',
      type: 'boolean',
      required: false,
      default: false
    },
    retry: retry
  },
  perform: async (request, data) => {
    const { payload, settings, statsContext, auth } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    testConditionsToRetry({
      timestamp: payload.timestamp || new Date().toISOString(),
      statsContext: statsContext,
      retry: payload.retry
    })

    const profileExtensionTable = String(payload.pet_name || settings.profileExtensionTable)

    if (
      !(
        typeof profileExtensionTable !== 'undefined' &&
        profileExtensionTable !== null &&
        profileExtensionTable.trim().length > 0
      )
    ) {
      throw new IntegrationError(
        'Send Custom Traits Action requires "PET Name" setting field to be populated',
        'PET_NAME_SETTING_MISSING',
        400
      )
    }

    validateListMemberPayload(payload.userData)

    return sendToPet(request, auth as AuthTokens, [payload], settings, userDataFieldNames)
  },

  performBatch: async (request, data) => {
    const { payload, settings, statsContext, auth } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)

    const validatedPayloads: Payload[] = []
    for (const item of payload) {
      const profileExtensionTable = String(item.pet_name || settings.profileExtensionTable)
      if (!profileExtensionTable || profileExtensionTable.trim().length === 0) {
        continue
      }

      if (item.userData.EMAIL_ADDRESS_ || item.userData.RIID_ || item.userData.CUSTOMER_ID_) {
        validatedPayloads.push(item)
      }
    }

    testConditionsToRetry({
      timestamp: validatedPayloads[0].timestamp || new Date().toISOString(),
      statsContext: statsContext,
      retry: validatedPayloads[0].retry
    })

    return sendToPet(request, auth as AuthTokens, validatedPayloads, settings, userDataFieldNames)
  }
}

export default action
