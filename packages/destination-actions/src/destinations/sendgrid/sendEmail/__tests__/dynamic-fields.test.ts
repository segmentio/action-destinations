import nock from 'nock'
import { getTemplateContentURL } from '../constants'
import { URL } from 'node:url'
import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import Definition from '../../index'

const testDestination = createTestIntegration(Definition)

const settings = { sendGridApiKey: 'test-api-key' }
const payload = {
  template_id: 'd-test-template-id',
  dynamic_template_data: { existingKey: 'value' },
  from: {
    name: 'John Doe',
    email: 'john@doe.com'
  },
  to: {
    name: 'John Doe',
    email: 'john@doe.com'
  }
}

describe('dynamicTemplateData', () => {
  function getMockURL(settings: { sendGridApiKey: string; endpoint?: string }) {
    const templateId = 'd-test-template-id'
    const templateContentUrl = getTemplateContentURL(settings, templateId)
    const { origin, pathname } = URL.parse(templateContentUrl) as URL
    return { origin, pathname }
  }

  afterEach(() => {
    nock.cleanAll()
  })

  it('should return dynamic fields from the template', async () => {
    const templateId = 'd-test-template-id'
    const templateContentUrl = getTemplateContentURL(settings, templateId)
    const contentUrl = URL.parse(templateContentUrl) as URL
    nock(contentUrl.origin)
      .get(contentUrl.pathname)
      .reply(200, {
        generation: 'dynamic',
        versions: [
          {
            active: 1,
            html_content: '{{user.name}} {{user.email}}',
            plain_content: '{{user.phone}}',
            subject: '{{user.subject}}',
            thumbnail_url: '{{user.thumbnail}}'
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([{ label: 'user', value: 'user' }])
  })

  it('should filter out already selected tokens', async () => {
    const templateId = 'd-test-template-id'
    const templateContentUrl = getTemplateContentURL(settings, templateId)
    const { origin, pathname } = URL.parse(templateContentUrl) as URL

    nock(origin)
      .get(pathname)
      .reply(200, {
        generation: 'dynamic',
        versions: [
          {
            active: 1,
            html_content: '{{user}} {{user}}',
            plain_content: '{{anotherUser}}'
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload: {
        ...payload,
        dynamic_template_data: {
          user: {
            name: 'John Doe'
          }
        }
      }
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([{ label: 'anotherUser', value: 'anotherUser' }])
  })

  it('should return an error if template_id is missing', async () => {
    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload: {
        ...payload,
        template_id: ''
      }
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Template ID Field required before Dynamic Template Data fields can be configured',
        code: '404'
      }
    })
  })

  it('should return an error if template is not dynamic', async () => {
    const templateId = 'd-test-template-id'
    const templateContentUrl = getTemplateContentURL(settings, templateId)
    const { origin, pathname } = URL.parse(templateContentUrl) as URL
    nock(origin).get(pathname).reply(200, {
      generation: 'legacy',
      versions: []
    })

    const response = await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload
    })

    expect(response).toEqual({
      choices: [],
      error: { message: 'Template ID provided is not a dynamic template', code: '404' }
    })
  })

  it('should return an error if no active version is found', async () => {
    const { origin, pathname } = getMockURL(settings)

    nock(origin).get(pathname).reply(200, {
      generation: 'dynamic',
      versions: []
    })

    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: { message: 'No active version found for the provided template', code: '404' }
    })
  })

  it('should return an error if template content is empty', async () => {
    const { origin, pathname } = getMockURL(settings)
    nock(origin)
      .get(pathname)
      .reply(200, {
        generation: 'dynamic',
        versions: [
          {
            active: 1,
            html_content: '',
            plain_content: '',
            subject: '',
            thumbnail_url: ''
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: { message: 'Returned template has no content', code: '404' }
    })
  })

  it('should handle HTTP errors gracefully', async () => {
    const { origin, pathname } = getMockURL(settings)

    nock(origin).get(pathname).reply(500, { error: 'Internal Server Error' })

    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: { message: 'Unknown error: dynamicTemplateData', code: '404' }
    })
  })

  it('should succeed with EU endpoint', async () => {
    const settingsEU = { ...settings, endpoint: 'https://api.eu.sendgrid.com' }
    const { origin, pathname } = getMockURL(settingsEU)
    nock(origin)
      .get(pathname)
      .reply(200, {
        generation: 'dynamic',
        versions: [
          {
            active: 1,
            html_content: '{{user.name}} {{user.email}}',
            plain_content: '{{user.phone}}',
            subject: '{{user.subject}}',
            thumbnail_url: '{{user.thumbnail}}'
          }
        ]
      })
    const response = (await testDestination.testDynamicField('sendEmail', 'dynamic_template_data.__keys__', {
      settings: { ...settings, endpoint: 'https://api.eu.sendgrid.com' },
      payload
    })) as DynamicFieldResponse
    expect(response.choices).toEqual([{ label: 'user', value: 'user' }])
  })
})
describe('dynamicGroupId', () => {
  const settings = { sendGridApiKey: 'test-api-key' }

  afterEach(() => {
    nock.cleanAll()
  })

  it('should return group ids from the API', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/asm/groups')
      .reply(200, [
        {
          id: '123',
          name: 'Newsletter',
          description: 'Monthly newsletter subscribers'
        },
        {
          id: '456',
          name: 'Marketing',
          description: 'Marketing emails'
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'group_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([
      { label: 'Newsletter [123]', value: 'Newsletter [123]' },
      { label: 'Marketing [456]', value: 'Marketing [456]' }
    ])
  })

  it('should return an empty list if no groups exist', async () => {
    nock('https://api.sendgrid.com').get('/v3/asm/groups').reply(200, [])

    const response = (await testDestination.testDynamicField('sendEmail', 'group_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([])
  })

  it('should handle HTTP errors gracefully', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/asm/groups')
      .reply(500, {
        errors: [{ message: 'Internal Server Error' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'group_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Internal Server Error',
        code: '500'
      }
    })
  })

  it('should handle authentication errors', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/asm/groups')
      .reply(401, {
        errors: [{ message: 'Invalid API key' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'group_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Invalid API key',
        code: '401'
      }
    })
  })

  it('should succeed with EU endpoint', async () => {
    const settingsEU = { ...settings, endpoint: 'https://api.eu.sendgrid.com' }

    nock('https://api.eu.sendgrid.com')
      .get('/v3/asm/groups')
      .reply(200, [
        {
          id: '123',
          name: 'Newsletter',
          description: 'Monthly newsletter subscribers'
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'group_id', {
      settings: settingsEU,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([{ label: 'Newsletter [123]', value: 'Newsletter [123]' }])
  })
})

describe('dynamicDomain', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return valid domains from the API', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/whitelabel/domains?limit=200')
      .reply(200, [
        {
          id: '123',
          domain: 'example.com',
          subdomain: 'mail',
          username: 'john',
          valid: true
        },
        {
          id: '456',
          domain: 'mydomain.com',
          subdomain: 'email',
          username: 'jane',
          valid: true
        },
        {
          id: '789',
          domain: 'invalid.com',
          subdomain: 'mail',
          username: 'admin',
          valid: false
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'domain', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([
      { label: 'example.com', value: 'example.com' },
      { label: 'mydomain.com', value: 'mydomain.com' }
    ])
  })

  it('should filter out invalid domains', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/whitelabel/domains?limit=200')
      .reply(200, [
        {
          id: '123',
          domain: 'valid.com',
          username: 'john',
          valid: true
        },
        {
          id: '456',
          domain: 'invalid.com',
          username: 'jane',
          valid: false
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'domain', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([{ label: 'valid.com', value: 'valid.com' }])
  })

  it('should return an empty list if no domains exist', async () => {
    nock('https://api.sendgrid.com').get('/v3/whitelabel/domains?limit=200').reply(200, [])

    const response = (await testDestination.testDynamicField('sendEmail', 'domain', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([])
  })

  it('should handle HTTP errors gracefully', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/whitelabel/domains')
      .reply(500, {
        errors: [{ message: 'Internal Server Error' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'domain', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Unknown error: dynamicDomain',
        code: '500'
      }
    })
  })

  it('should handle authentication errors', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/whitelabel/domains?limit=200')
      .reply(401, {
        errors: [{ message: 'Invalid API key' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'domain', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Invalid API key',
        code: '401'
      }
    })
  })

  it('should succeed with EU endpoint', async () => {
    const settingsEU = { ...settings, endpoint: 'https://api.eu.sendgrid.com' }

    nock('https://api.eu.sendgrid.com')
      .get('/v3/whitelabel/domains?limit=200')
      .reply(200, [
        {
          id: '123',
          domain: 'eu-domain.com',
          subdomain: 'mail',
          username: 'john',
          valid: true
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'domain', {
      settings: settingsEU,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([{ label: 'eu-domain.com', value: 'eu-domain.com' }])
  })
})
describe('dynamicTemplateId', () => {
  const settings = { sendGridApiKey: 'test-api-key' }

  afterEach(() => {
    nock.cleanAll()
  })

  it('should return template ids from the API', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(200, {
        result: [
          {
            id: '123',
            name: 'Welcome Email',
            generation: 'dynamic',
            versions: [
              {
                id: 'v1',
                template_id: 'd-abc123',
                active: 1,
                name: 'Default Version',
                subject: 'Welcome to our service'
              }
            ]
          },
          {
            id: '456',
            name: 'Monthly Newsletter',
            generation: 'dynamic',
            versions: [
              {
                id: 'v2',
                template_id: 'd-def456',
                active: 1,
                name: 'April Edition',
                subject: 'April Newsletter'
              },
              {
                id: 'v3',
                template_id: 'd-ghi789',
                active: 0, // not active
                name: 'May Edition',
                subject: 'May Newsletter'
              }
            ]
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([
      { label: 'Welcome Email - Default Version [d-abc123]', value: 'Welcome Email - Default Version [d-abc123]' },
      { label: 'Monthly Newsletter - April Edition [d-def456]', value: 'Monthly Newsletter - April Edition [d-def456]' }
    ])
  })

  it('should truncate long template and version names', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(200, {
        result: [
          {
            id: '123',
            name: 'This is a very long template name that should be truncated in the results',
            generation: 'dynamic',
            versions: [
              {
                id: 'v1',
                template_id: 'd-abc123',
                active: 1,
                name: 'This is a very long version name that should also be truncated in the results',
                subject: 'Welcome to our service'
              }
            ]
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices[0].label).toContain('...')
    expect(response.choices[0].value).toContain('...')
    expect(response.choices[0].label.length).toBeLessThan(
      'This is a very long template name that should be truncated in the results'.length +
        'This is a very long version name that should also be truncated in the results'.length
    )
  })

  it('should filter out non-active versions', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(200, {
        result: [
          {
            id: '123',
            name: 'Welcome Email',
            generation: 'dynamic',
            versions: [
              {
                id: 'v1',
                template_id: 'd-abc123',
                active: 0, // not active
                name: 'Default Version',
                subject: 'Welcome to our service'
              }
            ]
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([])
  })

  it('should filter out non-dynamic templates', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(200, {
        result: [
          {
            id: '123',
            name: 'Legacy Template',
            generation: 'legacy',
            versions: [
              {
                id: 'v1',
                template_id: 'd-abc123',
                active: 1,
                name: 'Default Version',
                subject: 'Welcome to our service'
              }
            ]
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([])
  })

  it('should return an empty list if no templates exist', async () => {
    nock('https://api.sendgrid.com').get('/v3/templates?generations=dynamic&page_size=200').reply(200, {
      result: []
    })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([])
  })

  it('should handle HTTP errors gracefully', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(500, {
        errors: [{ message: 'Internal Server Error' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Internal Server Error',
        code: '500'
      }
    })
  })

  it('should handle authentication errors', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(401, {
        errors: [{ message: 'Invalid API key' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Invalid API key',
        code: '401'
      }
    })
  })

  it('should succeed with EU endpoint', async () => {
    const settingsEU = { ...settings, endpoint: 'https://api.eu.sendgrid.com' }

    nock('https://api.eu.sendgrid.com')
      .get('/v3/templates?generations=dynamic&page_size=200')
      .reply(200, {
        result: [
          {
            id: '123',
            name: 'EU Template',
            generation: 'dynamic',
            versions: [
              {
                id: 'v1',
                template_id: 'd-abc123',
                active: 1,
                name: 'EU Version',
                subject: 'Welcome to our EU service'
              }
            ]
          }
        ]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'template_id', {
      settings: settingsEU,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([
      { label: 'EU Template - EU Version [d-abc123]', value: 'EU Template - EU Version [d-abc123]' }
    ])
  })
})

describe('dynamicIpPoolNames', () => {
  const settings = { sendGridApiKey: 'test-api-key' }

  afterEach(() => {
    nock.cleanAll()
  })

  it('should return IP pool names from the API', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/ips/pools')
      .reply(200, [
        {
          name: 'Transactional',
          id: 'trans123'
        },
        {
          name: 'Marketing',
          id: 'mark456'
        },
        {
          name: 'Notifications',
          id: 'notif789'
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'ip_pool_name', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([
      { label: 'Transactional', value: 'Transactional' },
      { label: 'Marketing', value: 'Marketing' },
      { label: 'Notifications', value: 'Notifications' }
    ])
  })

  it('should return an empty list if no IP pools exist', async () => {
    nock('https://api.sendgrid.com').get('/v3/ips/pools').reply(200, [])

    const response = (await testDestination.testDynamicField('sendEmail', 'ip_pool_name', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([])
  })

  it('should handle HTTP errors gracefully', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/ips/pools')
      .reply(500, {
        errors: [{ message: 'Internal Server Error' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'ip_pool_name', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Internal Server Error',
        code: '500'
      }
    })
  })

  it('should handle authentication errors', async () => {
    nock('https://api.sendgrid.com')
      .get('/v3/ips/pools')
      .reply(401, {
        errors: [{ message: 'Invalid API key' }]
      })

    const response = (await testDestination.testDynamicField('sendEmail', 'ip_pool_name', {
      settings,
      payload
    })) as DynamicFieldResponse

    expect(response).toEqual({
      choices: [],
      error: {
        message: 'Invalid API key',
        code: '401'
      }
    })
  })

  it('should succeed with EU endpoint', async () => {
    const settingsEU = { ...settings, endpoint: 'https://api.eu.sendgrid.com' }

    nock('https://api.eu.sendgrid.com')
      .get('/v3/ips/pools')
      .reply(200, [
        {
          name: 'EU Pool',
          id: 'eu123'
        }
      ])

    const response = (await testDestination.testDynamicField('sendEmail', 'ip_pool_name', {
      settings: settingsEU,
      payload
    })) as DynamicFieldResponse

    expect(response.choices).toEqual([{ label: 'EU Pool', value: 'EU Pool' }])
  })
})
