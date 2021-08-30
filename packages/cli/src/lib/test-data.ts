import { ActionDefinition, DestinationDefinition } from "@segment/actions-core"

const testData: { [key: string]: any } = {
  boolean: true,
  datetime: '2021-01-17',
  integer: 1,
  number: 5,
  string: 'test1234',
  text: 'test text'
}

export function generateTestData(destination: DestinationDefinition<any>, action: ActionDefinition<any>) {
  const settingsData: any = {}
  const authentication = destination.authentication
  if (authentication) {
    for (const settingKey in authentication.fields) {
      const type = authentication.fields[settingKey].type
      switch (settingKey) {
        case 'endpoint' || 'url':
          settingsData[settingKey] = 'https://www.example.com'
          break
        default:
          settingsData[settingKey] = testData[type]
          break
      }
    }
  }

  const eventData: any = {}
  for (const name in action.fields) {
    const field = action.fields[name]
    const { properties, type } = field
    if (properties) {
      const subData: any = {}
      const propertyFields = Object.keys(properties)
      for (const propertyField of propertyFields) {
        const property = properties[propertyField]
        if (property.required) subData[propertyField] = testData[property.type]
        if (propertyField.includes('id')) subData[propertyField] = 'id123'
      }

      if (field.multiple) {
        eventData[name] = [subData]
      } else {
        eventData[name] = subData
      }
    } else {
      if (name === 'currency') eventData[name] = 'USD'
      if (field.required) {
        switch (name) {
          case 'url':
            eventData[name] = 'https://www.example.com'
            break
          case 'email':
            eventData[name] = 'test@twilio.com'
            break
          case 'currency':
            eventData[name] = 'USD'
            break
          default:
            eventData[name] = testData[type]
            break
        }
      }
    }
  }

  return [eventData, settingsData]
}
