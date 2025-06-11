import { ActionDefinition, RequestClient, DynamicFieldResponse, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { contactIdentifier } from '../input-fields'
import { DDEnrolmentApi, DDContactApi } from '../api'
import { ChannelIdentifier, Identifiers } from '../api/types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Enrol Contact to Program',
  description: 'Creates a program enrolment.',
  defaultSubscription: 'type = "track" and event = "Enrol Contact to Program"',
  fields: {
    ...contactIdentifier,
    programId: {
      label: 'Program',
      description: `List of active programs`,
      type: 'string',
      required: true,
      dynamic: true
    }
  },

  dynamicFields: {
    programId: async (request: RequestClient, { settings }: { settings: Settings }): Promise<DynamicFieldResponse> => {
      return new DDEnrolmentApi(settings, request).getPrograms()
    }
  },

  perform: async (request, { settings, payload }) => {
    const contactApi = new DDContactApi(settings, request)
    const enrolmentApi = new DDEnrolmentApi(settings, request)
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier, programId } = payload

    const identifiers: Identifiers = {
      email: emailIdentifier ?? undefined,
      mobileNumber: mobileNumberIdentifier ?? undefined
    }

    let channel: ChannelIdentifier

    if (channelIdentifier === 'email' && typeof emailIdentifier === 'string') {
      channel = { email: emailIdentifier }
    } else if (channelIdentifier === 'mobile-number' && typeof mobileNumberIdentifier === 'string') {
      channel = { 'mobile-number': mobileNumberIdentifier }
    } else {
      throw new PayloadValidationError('Invalid channel identifier')
    }

    const contact = await contactApi.fetchOrCreateContact(channel, { identifiers })

    return enrolmentApi.enrolContact(programId, contact)
  }
}

export default action
