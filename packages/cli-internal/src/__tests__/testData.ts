import type { DestinationDefinition } from '../lib/destinations'
import type { DestinationMetadata } from '../lib/control-plane-service'

export const expectedDestinationMetadataOptions = {
  customKey: {
    default: '',
    description:
      'An API SECRET generated in the Google Analytics UI, navigate to: Admin > Data Streams > choose your stream > Measurement Protocol > Create',
    encrypt: false,
    hidden: false,
    label: 'API Key',
    private: true,
    scope: 'event_destination',
    type: 'string',
    validators: [['required', 'The customKey property is required.']]
  }
}

export const destinationMetadata: DestinationMetadata = {
  id: '60ad61f9ff47a16b8fb7b5d9',
  name: 'Actions Test Action',
  slug: 'test-action',
  type: 'action_destination',
  contentId: 'test-action',
  createdAt: '2021-05-25T20:45:45.105Z',
  updatedAt: '2021-06-09T22:52:31.900Z',
  creationName: 'Actions Test Action',
  previousNames: ['Actions Test Action'],
  public: false,
  status: 'PRIVATE_BETA',
  description: 'Actions Test Action',
  note: '',
  categories: ['Analytics'],
  website: 'https://support.google.com/analytics/answer/10089681',
  level: 3,
  owners: [],
  contacts: [
    {
      name: 'Contact McDummyData',
      email: 'set@me.org',
      role: 'VP of changing this field',
      isPrimary: false
    }
  ],
  direct: false,
  endpoint: '',
  logos: {
    default: 'https://cdn.filepicker.io/api/file/QJj6FavSYSz2rYpxl6hw',
    mark: 'https://cdn.filepicker.io/api/file/wfX0JcRaGPaaPww1jKw8'
  },
  methods: {
    track: true,
    pageview: false,
    identify: false,
    group: false,
    alias: false
  },
  platforms: { browser: false, mobile: false, server: true },
  components: [],
  replaySupported: false,
  features: {
    replayPolicy: {
      identifyAcceptsTimestamps: false,
      identifyHasDedupeLogic: false,
      groupAcceptsTimestamps: false,
      groupHasDedupeLogic: false,
      aliasAcceptsTimestamps: false,
      aliasHasDedupeLogic: false,
      trackAcceptsTimestamps: false,
      trackHasDedupeLogic: false,
      pageviewAcceptsTimestamps: false,
      pageviewHasDedupeLogic: false,
      acceptsTimestamps: false,
      hasDedupeLogic: false,
      note: ''
    },
    audiencesPolicy: {
      frequencyLimitSeconds: null,
      sendIdentify: true,
      sendTrack: false
    }
  },
  browserUnbundlingSupported: false,
  browserUnbundlingChangelog: '',
  unbundleByDefault: false,
  browserUnbundlingPublic: true,
  options: {
    customKey: {
      type: 'string',
      default: '',
      private: true,
      encrypt: false,
      hidden: false,
      scope: 'event_destination',
      label: 'API Key',
      description: 'API Key description',
      validators: []
    }
  },
  basicOptions: ['customKey'],
  advancedOptions: [],
  developerCenterMetadata: {},
  partnerSettings: {},
  personasMaxRequestsPerSecond: null,
  supportsDemux: false,
  multiInstanceSupportedVersion: 'UNSUPPORTED'
}

export const destinationSchema: DestinationDefinition = {
  name: 'Test Slug',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
    fields: {
      customKey: {
        label: 'API Key',
        description:
          'An API SECRET generated in the Google Analytics UI, navigate to: Admin > Data Streams > choose your stream > Measurement Protocol > Create',
        type: 'string',
        required: true
      }
    },
    testAuthentication: () => {
      // Return a request that tests/validates the user's credentials here
    }
  },
  actions: {
    purchase: {
      title: 'Purchase',
      description: 'Send purchase events to GA4 to make the most of the ecommerce reports in Google Analytics',
      defaultSubscription: 'type = "track" and event = "Order Completed"',
      fields: {
        client_id: {
          label: 'Client ID',
          description: 'Uniquely identifies a user instance of a web client.',
          type: 'string',
          required: true,
          default: {
            '@if': {
              exists: {
                '@path': '$.userId'
              },
              then: {
                '@path': '$.userId'
              },
              else: {
                '@path': '$.anonymousId'
              }
            }
          }
        },
        affiliation: {
          label: 'Affiliation',
          type: 'string',
          description: 'Store or affiliation from which this transaction occurred (e.g. Google Store).',
          default: {
            '@path': '$.properties.affiliation'
          }
        }
      },
      perform: () => {
        return
      }
    }
  },
  slug: 'test-action'
}
