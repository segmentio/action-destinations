import { Payload } from '../saveCustomEvent/generated-types'

export function transformForm(payload: Payload) {
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
