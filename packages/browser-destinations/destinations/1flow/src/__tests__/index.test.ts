import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import _1FlowDestination, { destination } from '../index'

const subscriptions: Subscription[] = [
    {
        name: 'Identify user',
        subscribe: 'type = "identify"',
        partnerAction: 'identify',
        enabled: true,
        mapping: {
            userId: {
                type: 'string',
                required: true,
                label: 'User ID',
                description: 'Unique user ID',
                default: {
                    '@path': '$.userId'
                }
            },
            anonymousId: {
                type: 'string',
                required: false,
                description: 'Anonymous id of the user',
                label: 'Anonymous ID',
                default: {
                    '@path': '$.anonymousId'
                }
            },
            traits: {
                type: 'object',
                required: false,
                description: 'User traits used to enrich user identification',
                label: 'Traits',
                default: {
                    '@path': '$.traits'
                }
            }, first_name: {
                description: "The user's first name.",
                label: 'First Name',
                type: 'string',
                required: false,
                default: {
                    '@path': '$.traits.first_name'
                }
            },
            last_name: {
                description: "The user's last name.",
                label: 'First Name',
                type: 'string',
                required: false,
                default: {
                    '@path': '$.traits.last_name'
                }
            },
            phone: {
                description: "The user's phone number.",
                label: 'Phone Number',
                type: 'string',
                required: false,
                default: {
                    '@path': '$.traits.phone'
                }
            },

            email: {
                description: "The user's email address.",
                label: 'Email Address',
                type: 'string',
                required: false,
                default: {
                    '@path': '$.traits.email'
                }
            }
        }
    },
    {
        name: 'Track event',
        subscribe: 'type = "track"',
        partnerAction: 'track',
        enabled: true,
        mapping: {
            event_name: {
                description: 'The name of the event.',
                label: 'Event Name',
                type: 'string',
                required: true,
                default: {
                    '@path': '$.event'
                }
            },
            properties: {
                description: 'Information associated with the event',
                label: 'Event Properties',
                type: 'object',
                required: false,
                default: {
                    '@path': '$.properties'
                }
            },
            user_id: {
                description: 'A unique identifier for the user.',
                label: 'User ID',
                type: 'string',
                required: false,
                default: {
                    '@path': '$.userId'
                }
            },
            anonymous_id: {
                description: "An anonymous identifier for the user.",
                label: 'Anonymous ID',
                type: 'string',
                required: false,
                default: {
                    '@path': '$.anonymousId'
                }
            },
        }
    }
]

describe('_1Flow', () => {
    beforeAll(() => {
        jest.mock('@segment/browser-destination-runtime/load-script', () => ({
            loadScript: (_src: any, _attributes: any) => { }
        }))
        jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
            resolveWhen: (_fn: any, _timeout: any) => { }
        }))
    })

    const testID = 'testId'

    test('load 1Flow SDK', async () => {
        const [event] = await _1FlowDestination({
            id: testID,
            subscriptions
        })

        jest.spyOn(destination, 'initialize')
        await event.load(Context.system(), {} as Analytics)
        expect(destination.initialize).toHaveBeenCalled()

        const scripts = window.document.querySelectorAll('script')
        expect(scripts).toMatchSnapshot(`
    <script
      type="text/javascript"
      src="https://cdn-development.1flow.ai/js-sdk/${testID}.js"
      async=""
      status="loaded">
      </script>
    `)
    })
})



