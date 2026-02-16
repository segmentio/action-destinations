import { ActionDefinition, DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDContactApi, DDListsApi, DDDataFieldsApi } from '@segment/actions-shared'
import { contactIdentifier } from '../input-fields'
const { channelIdentifier, emailIdentifier, mobileNumberIdentifier } = contactIdentifier

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add or Update Contact',
  description: 'Adds or updates a contact.',
  defaultSubscription: 'type = "track" and event = "Add or Update Contact"',
  fields: {
    channelIdentifier,
    emailIdentifier,
    mobileNumberIdentifier,
    emailType: {
      label: 'Email Type',
      description: 'The type of email the contact prefers to receive.',
      type: 'string',
      choices: [
        { label: 'HTML', value: 'html' },
        { label: 'Plain Text', value: 'plainText' }
      ],
      default: 'html',
      depends_on: {
        conditions: [{ fieldKey: 'channelIdentifier', operator: 'is', value: 'email' }]
      },
      required: false
    },
    optInType: {
      label: 'Opt-in Type',
      description: 'The type of opt-in used for this contact. [Learn more](https://support.dotdigital.com/en/articles/8198810-email-opt-in-types)',
      type: 'string',
      choices: [
        { label: 'Unknown', value: 'unknown' },
        { label: 'Single', value: 'single' },
        { label: 'Double', value: 'double' },
        { label: 'Verified Double', value: 'verifiedDouble' }
      ],
      default: 'single',
      depends_on: {
        conditions: [{ fieldKey: 'channelIdentifier', operator: 'is', value: 'email' }]
      },
      required: false
    },
    updateEmailSubscription: {
      label: 'Update Email Subscription Status',
      description: 'Choose whether to update the email subscription status.',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [{ fieldKey: 'channelIdentifier', operator: 'is', value: 'email' }]
      },
      required: false
    },
    emailSubscriptionStatus: {
      label: 'Email Subscription Status',
      description: 'The subscription status for the email channel.',
      type: 'string',
      choices: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Suppressed', value: 'suppressed' }
      ],
      default: 'subscribed',
      depends_on: {
        conditions: [{ fieldKey: 'updateEmailSubscription', operator: 'is', value: true }]
      },
      required: false
    },
    emailResubscribe: {
      label: 'Resubscribe if Previously Unsubscribed',
      description: 'When Yes, the action will send a "subscribed" status in the API call for email.',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [
          { fieldKey: 'updateEmailSubscription', operator: 'is', value: true },
          { fieldKey: 'emailSubscriptionStatus', operator: 'is', value: 'subscribed' }
        ],
        match: 'all'
      },
      required: false
    },
    resubscribeWithoutChallengeEmail: {
      label: 'Resubscribe Without Challenge Email',
      description: 'If Yes, no resubscription confirmation email will be sent.',
      type: 'boolean',
      default: false,
      depends_on: {
        conditions: [
          { fieldKey: 'emailResubscribe', operator: 'is', value: true }
        ]
      },
      required: false
    },
    preferredLocale: {
      label: 'Preferred Language',
      description: 'Choose the language that you would like the resubscribe request email to be sent in.',
      choices: [
        { label: 'cs-CS', value: 'cs-CS' },
        { label: 'da-DA', value: 'da-DA' },
        { label: 'de-DE', value: 'de-DE' },
        { label: 'el-EL', value: 'el-EL' },
        { label: 'en-EN', value: 'en-EN' },
        { label: 'es-ES', value: 'es-ES' },
        { label: 'es', value: 'es' },
        { label: 'fi-FI', value: 'fi-FI' },
        { label: 'fr-FR', value: 'fr-FR' },
        { label: 'hu-HU', value: 'hu-HU' },
        { label: 'it-IT', value: 'it-IT' },
        { label: 'nl-NL', value: 'nl-NL' },
        { label: 'nb-NO', value: 'nb-NO' },
        { label: 'pl-PL', value: 'pl-PL' },
        { label: 'pt-PT', value: 'pt-PT' },
        { label: 'ru-RU', value: 'ru-RU' },
        { label: 'se-SE', value: 'se-SE' },
        { label: 'sk-SK', value: 'sk-SK' },
        { label: 'tr-TR', value: 'tr-TR' },
        { label: 'zh-CN', value: 'zh-CN' }
      ],
      type: 'string',
      depends_on: {
        conditions: [
          { fieldKey: 'emailResubscribe', operator: 'is', value: true },
          { fieldKey: 'resubscribeWithoutChallengeEmail', operator: 'is', value: false }
        ],
        match: 'all'
      },
      required: false
    },
    redirectUrlAfterChallenge: {
      label: 'Redirect URL',
      description: 'The URL you would like to redirect challenged contacts to after they have completed their resubscription.',
      type: 'string',
      depends_on: {
        conditions: [
          { fieldKey: 'emailResubscribe', operator: 'is', value: true },
          { fieldKey: 'resubscribeWithoutChallengeEmail', operator: 'is', value: false }
        ],
        match: 'all'
      },
      required: false
    },
    updateSmsSubscription: {
      label: 'Update SMS Subscription Status',
      description: 'Choose whether to update the SMS subscription status.',
      type: 'boolean',
      default: true,
      depends_on: {
        conditions: [{ fieldKey: 'channelIdentifier', operator: 'is', value: 'mobileNumber' }]
      },
      required: false
    },
    smsSubscriptionStatus: {
      label: 'SMS Subscription Status',
      description: 'The subscription status for the SMS channel.',
      type: 'string',
      choices: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Suppressed', value: 'suppressed' }
      ],
      default: 'subscribed',
      depends_on: {
        conditions: [{ fieldKey: 'updateSmsSubscription', operator: 'is', value: true }]
      },
      required: false
    },
    listId: {
      label: 'List',
      description: `The list to add the contact to.`,
      type: 'number',
      required: false,
      allowNull: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      dynamic: true
    },
    dataFields: {
      label: 'Data Fields',
      description: `An object containing key/value pairs for data fields assigned to this Contact. Custom Data Fields must already be defined in Dotdigital.`,
      type: 'object',
      required: false,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      defaultObjectUI: 'keyvalue:only',
      additionalProperties: false,
      dynamic: true
    }
  },
  dynamicFields: {
    listId: async (request: RequestClient, { settings }): Promise<DynamicFieldResponse> => {
      return new DDListsApi(settings.api_host, request).getLists()
    },
    dataFields: {
      __keys__: async (request, { settings }) => {
        return new DDDataFieldsApi(settings.api_host, request).getDataFields()
      }
    }
  },

  perform: async (request, { settings, payload }) => {
    const fieldsAPI = new DDDataFieldsApi(settings.api_host, request)
    await fieldsAPI.validateDataFields(payload)

    const contactApi = new DDContactApi(settings.api_host, request)
    return contactApi.upsertContact(payload)
  }
}

export default action
