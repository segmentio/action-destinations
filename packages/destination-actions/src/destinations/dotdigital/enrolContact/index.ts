import type { ActionDefinition, RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { contactIdentifier } from '../input-fields'
import { DotdigitalEnrolmentAPi, DotdigitalContactApi } from '../api'
import { ChannelIdentifier, Identifiers, Contact } from '../api/types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Enrol Contact to Program',
  description: 'Creates a program enrolment',
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
      return new DotdigitalEnrolmentAPi(settings, request).getPrograms()
    }
  },

  perform: async (request, { settings, payload }) => {
    const dotdigitalContact = new DotdigitalContactApi(settings, request)
    const DotdigitalEnrolments = new DotdigitalEnrolmentAPi(settings, request)
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier, programId }: Payload = payload
    
    const resolvedChannelIdentifier: ChannelIdentifier = channelIdentifier === 'email'
        ? { 'email': emailIdentifier as string }
        : { 'mobile-number': mobileNumberIdentifier as string }
      
    const _ContactIdentifiers: Identifiers = {
      email: emailIdentifier ?? '',
      mobileNumber: mobileNumberIdentifier ?? ''
    }

    const contact: Contact = await dotdigitalContact.fetchOrCreateContact(resolvedChannelIdentifier, {
      identifiers: _ContactIdentifiers
    })

    return DotdigitalEnrolments.enrolContact(programId, contact)
  }
}

export default action
