import nock from 'nock'
import { getTemplateContentURL } from '../constants'
import { URL } from 'node:url'
import { createTestIntegration, DynamicFieldResponse } from '@segment/actions-core'
import Definition from '../../index'

const testDestination = createTestIntegration(Definition)

describe('dynamicTemplateData', () => {
  function getMockURL(settings: { sendGridApiKey: string; endpoint?: string }) {
    const templateId = 'd-test-template-id'
    const templateContentUrl = getTemplateContentURL(settings, templateId)
    const { origin, pathname } = URL.parse(templateContentUrl) as URL
    return { origin, pathname }
  }
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
