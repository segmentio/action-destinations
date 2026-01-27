import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> = {
    email: {
        label: 'Email',
        description: 'Email address of the user',
        type: 'string',
        unsafe_hidden: false,
        required: false,
        default: {
            '@if': {
                exists: { '@path': '$.traits.email' },
                then: { '@path': '$.traits.email' },
                else: { '@path': '$.context.traits.email' }
            }
        }
    },
    userId: {
        label: 'User ID',
        description: 'User ID',
        type: 'string',
        unsafe_hidden: false,
        required: false,
        default: {
            '@path': '$.userId'
        }
    },
    dataFields: {
        label: 'Additional traits or identifiers',
        description:
            'Additional traits or identifiers to sync to Iterable. You will need to ensure these traits or objects are included via Event Settings > Customized Setup.',
        required: false,
        type: 'object'
    },
    traitsOrProperties: {
        label: 'Traits or Properties',
        description: 'Traits or Properties object from the identify() or track() call emitted by Engage',
        type: 'object',
        required: true,
        default: {
            '@if': {
                exists: { '@path': '$.traits' },
                then: { '@path': '$.traits' },
                else: { '@path': '$.properties' }
            }
        }     
    },
    segmentAudienceKey: {
        label: 'Segment Audience Key',
        description: 'Segment Audience Key. Maps to the Iterable List "Name" when the list is created in Iterable.',
        type: 'string',
        required: true,
        default: {
            '@path': '$.context.personas.computation_key'
        }
    },
    segmentAudienceId: {
        label: 'Segment External Audience ID',
        description: 'Segment External Audience ID. Maps to the List ID when the list is created in Iterable.',
        type: 'string',
        required: true,
        default: {
            '@path': '$.context.personas.external_audience_id'
        }
    }
}