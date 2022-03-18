"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("../../../lib/dayjs"));
function serializeEvent(event) {
    return {
        ...event,
        timestamp: dayjs_1.default.utc(event.timestamp).toISOString()
    };
}
const action = {
    title: 'Send Event',
    description: 'Send an event to Metronome',
    fields: {
        transaction_id: {
            type: 'string',
            label: 'transaction_id',
            description: 'The Metronome transaction ID uniquely identifies an event to ensure Metronome only processes each event once.',
            required: true,
            default: {
                '@path': '$.messageId'
            }
        },
        customer_id: {
            type: 'string',
            label: 'customer_id',
            description: 'The Metronome customer ID or ingest alias this event should be associated with.',
            required: true,
            default: {
                '@path': '$.context.groupId'
            }
        },
        timestamp: {
            type: 'datetime',
            label: 'timestamp',
            description: 'The timestamp at which this event occurred.',
            required: true,
            default: {
                '@path': '$.timestamp'
            }
        },
        event_type: {
            type: 'string',
            label: 'event_type',
            description: 'The Metronome `event_type`.',
            required: true,
            default: {
                '@path': '$.event'
            }
        },
        properties: {
            type: 'object',
            label: 'properties',
            description: 'The Metronome properties object.',
            required: true,
            default: {
                '@path': '$.properties'
            }
        }
    },
    perform: (request, { payload }) => {
        return request('https://api.metronome.com/v1/ingest', {
            method: 'post',
            json: [serializeEvent(payload)]
        });
    }
};
exports.default = action;
//# sourceMappingURL=index.js.map