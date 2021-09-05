import { ActionDefinition, DestinationDefinition } from '@segment/actions-core'

const testData: { [key: string]: any } = {
  boolean: true,
  datetime: '2021-01-17',
  integer: 1,
  number: 5,
  string: 'test1234',
  text: 'test text',
  object: {
    testObject: 'data1234'
  }
}

function setCustomData(data: any, name: string, format: string | undefined, isMultiple?: boolean) {
  if (format === 'uri') data[name] = 'https://www.example.com'
  if (name === 'email') data[name] = 'test@twilio.com'
  if (name === 'email' && isMultiple) data[name] = ['test@twilio.com']
  if (name === 'currency') data[name] = 'USD'
  return data
}

function setData(eventData: any, name: string, field: any, data?: any) {
  const { format, multiple, type } = field

  if (!data) {
    data = testData[type]
  }

  eventData[name] = multiple ? [data] : data
  eventData = setCustomData(eventData, name, format, multiple)
  return eventData
}

export function generateTestData(
  destination: DestinationDefinition<any>,
  action: ActionDefinition<any>,
  isRequiredOnly: boolean
) {
  let eventData: any = {}
  const settingsData: any = {}

  const authentication = destination.authentication
  if (authentication) {
    for (const settingKey in authentication.fields) {
      const { format, type } = authentication.fields[settingKey]
      settingsData[settingKey] = testData[type]
      if (format === 'uri') {
        settingsData[settingKey] = 'https://www.example.com'
      }
    }
  }

  for (const [name, field] of Object.entries(action.fields)) {
    if (isRequiredOnly && !(field.required || name.includes('id'))) {
      continue
    }

    const { properties } = field

    if (properties) {
      let subData: any = {}
      const propertyFields = Object.keys(properties)
      if (isRequiredOnly) propertyFields.filter((name) => properties[name].required)

      for (const propertyName of propertyFields) {
        const property = properties[propertyName]
        subData = setData(subData, propertyName, property)
      }

      eventData = setData(eventData, name, field, subData)
      continue
    }

    eventData = setData(eventData, name, field)
  }

  return [eventData, settingsData]
}
