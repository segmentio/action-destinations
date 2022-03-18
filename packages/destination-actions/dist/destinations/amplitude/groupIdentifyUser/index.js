"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("../../../lib/dayjs"));
const regional_endpoints_1 = require("../regional-endpoints");
const action = {
    title: 'Group Identify User',
    description: 'Set or update properties of particular groups. Note that these updates will only affect events going forward.',
    defaultSubscription: 'type = "group"',
    fields: {
        user_id: {
            label: 'User ID',
            type: 'string',
            allowNull: true,
            description: 'A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. Required unless device ID is present.',
            default: {
                '@path': '$.userId'
            }
        },
        device_id: {
            label: 'Device ID',
            type: 'string',
            description: 'A device specific identifier, such as the Identifier for Vendor (IDFV) on iOS. Required unless user ID is present.',
            default: {
                '@if': {
                    exists: { '@path': '$.context.device.id' },
                    then: { '@path': '$.context.device.id' },
                    else: { '@path': '$.anonymousId' }
                }
            }
        },
        insert_id: {
            label: 'Insert ID',
            type: 'string',
            description: 'Amplitude will deduplicate subsequent events sent with this ID we have already seen before within the past 7 days. Amplitude recommends generating a UUID or using some combination of device ID, user ID, event type, event ID, and time.'
        },
        time: {
            label: 'Timestamp',
            type: 'string',
            description: 'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
            default: {
                '@path': '$.timestamp'
            }
        },
        group_properties: {
            label: 'Group Properties',
            type: 'object',
            description: 'Additional data tied to the group in Amplitude.',
            default: {
                '@path': '$.traits'
            }
        },
        group_type: {
            label: 'Group Type',
            type: 'string',
            description: 'The type of the group',
            required: true
        },
        group_value: {
            label: 'Group Value',
            type: 'string',
            description: 'The value of the group',
            required: true
        },
        min_id_length: {
            label: 'Minimum ID Length',
            description: 'Amplitude has a default minimum id lenght of 5 characters for user_id and device_id fields. This field allows the minimum to be overridden to allow shorter id lengths.',
            allowNull: true,
            type: 'integer'
        }
    },
    perform: async (request, { payload, settings }) => {
        const groupAssociation = { [payload.group_type]: payload.group_value };
        const { min_id_length } = payload;
        let options;
        if (min_id_length && min_id_length > 0) {
            options = JSON.stringify({ min_id_length });
        }
        await request(regional_endpoints_1.getEndpointByRegion('identify', settings.endpoint), {
            method: 'post',
            body: new URLSearchParams({
                api_key: settings.apiKey,
                identification: JSON.stringify([
                    {
                        device_id: payload.device_id,
                        groups: groupAssociation,
                        insert_id: payload.insert_id,
                        library: 'segment',
                        time: dayjs_1.default.utc(payload.time).valueOf(),
                        user_id: payload.user_id,
                        user_properties: groupAssociation
                    }
                ]),
                options
            })
        });
        return request(regional_endpoints_1.getEndpointByRegion('groupidentify', settings.endpoint), {
            method: 'post',
            body: new URLSearchParams({
                api_key: settings.apiKey,
                identification: JSON.stringify([
                    {
                        group_properties: payload.group_properties,
                        group_value: payload.group_value,
                        group_type: payload.group_type,
                        library: 'segment'
                    }
                ]),
                options
            })
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map