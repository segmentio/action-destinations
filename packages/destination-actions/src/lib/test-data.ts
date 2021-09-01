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

export default function generateTestData(
  destination: DestinationDefinition<any>,
  action: ActionDefinition<any>,
  flag: string
) {
  let eventData: any = {}
  const settingsData: any = {}

  const authentication = destination.authentication
  if (authentication) {
    for (const settingKey in authentication.fields) {
      const type = authentication.fields[settingKey].type
      settingsData[settingKey] = testData[type]
      if (settingKey === 'endpoint') {
        settingsData[settingKey] = 'https://www.example.com'
      }
    }
  }

  for (const [name, field] of Object.entries(action.fields)) {
    if (flag === 'required' && !(field.required || name.includes('id'))) {
      continue
    }

    const { properties, type, format, multiple } = field

    if (properties) {
      let subData: any = {}
      const propertyFields = Object.keys(properties)
      if (flag === 'required') propertyFields.filter((name) => properties[name].required)

      for (const propField of propertyFields) {
        const property = properties[propField]
        const { format, multiple, type } = property

        subData[propField] = multiple ? [testData[type]] : testData[type]
        subData = setCustomData(subData, propField, format, multiple)
      }

      eventData[name] = multiple ? [subData] : subData
      eventData = setCustomData(eventData, name, format, multiple)
      continue
    }

    eventData[name] = multiple ? [testData[type]] : testData[type]
    eventData = setCustomData(eventData, name, format, multiple)
  }

  return [eventData, settingsData]
}
