import { Payload } from './generated-types'

export const payloadTransform = (payload: Payload) => {
    return {
      userId: payload.userId,
      events: [
        {
          event: payload.eventName,
          timestamp: new Date(payload.timestamp).getTime()
        }
      ]
    }
}