import { Payload } from './generated-types'
import { transformPayload as transformBasePayload } from '../saveBaseEvent/transform-payload'

export function transformFormPayload(payload: Payload) {
  return {
    form: {
      id: payload.id,
      action: payload.action,
      elements: payload.elements?.map((element) => ({
        id: element.id,
        name: element.name,
        tagName: element.tagName,
        type: element.type,
        value: element.value
      }))
    }
  }
}

export function transformPayload(payload: Payload) {
  const basePayload = transformBasePayload(payload)
  const formPayload = transformFormPayload(payload)

  const result = {
    ...basePayload,
    ...formPayload
  }

  return result
}
