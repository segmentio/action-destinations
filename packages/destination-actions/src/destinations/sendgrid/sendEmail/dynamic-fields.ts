import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import {
  GET_TEMPLATES_URL,
  TRUNCATE_CHAR_LENGTH,
  GET_IP_POOLS_URL,
  GET_VALID_DOMAINS_URL,
  GET_GROUP_IDS_URL,
  GET_TEMPLATE_CONTENT_URL
} from './constants'
import { parseTemplateId } from './utils'

interface ResultError {
  response: {
    status: number
    data: {
      errors: {
        message: string
      }[]
    }
  }
}

export async function dynamicTemplateData(request: RequestClient, payload: Payload): Promise<DynamicFieldResponse> {
  interface ResultItem {
    id: string
    template_id: string
    active: number
    name: string
    html_content: string
    plain_content?: string
    subject?: string
    thumbnail_url?: string
  }
  interface ResponseType {
    data: {
      id: string
      name: string
      generation: string
      versions: ResultItem[]
    }
  }

  interface ResultError {
    data: {
      error: string
    }
  }

  if (!payload.template_id) {
    throw new Error('Template ID Field required before Dynamic Template Data fields can be configured')
  }

  const templateId = parseTemplateId(payload.template_id ?? '')

  if (templateId == null || !templateId.startsWith('d-')) {
    throw new Error('Template must refer to a Dynamic Template. Dynamic Template IDs start with "d-"')
  }

  try {
    const response: ResponseType = await request(`${GET_TEMPLATE_CONTENT_URL}${templateId}`, {
      method: 'GET',
      skipResponseCloning: true
    })

    if (response.data.generation !== 'dynamic') {
      throw new Error('Template ID provided is not a dynamic template')
    }

    const version = response.data.versions.find((version: ResultItem) => version.active === 1)

    if (!version) {
      throw new Error('No active version found for the provided template')
    }

    if (!version.html_content || version.html_content.length === 0) {
      throw new Error('Returned template has no content')
    }

    const extractTokens = (content: string | undefined): string[] =>
      [...(content ?? '').matchAll(/{{{?(\w+)}{0,3}}}/g)].map((match) => match[1])

    const uniqueTokens: string[] = [
      ...new Set([
        ...extractTokens(version.html_content),
        ...extractTokens(version.plain_content),
        ...extractTokens(version.subject),
        ...extractTokens(version.thumbnail_url)
      ])
    ]

    // remove token keys that are already selected
    const selectedTokens: string[] = Object.keys(payload.dynamic_template_data ?? {})

    const filteredTokens: string[] = uniqueTokens.filter((token) => !selectedTokens.includes(token))

    if (filteredTokens.length === 0) {
      throw new Error('No dynamic fields found in the provided template')
    }

    return {
      choices: filteredTokens.map((token) => {
        return {
          label: token,
          value: token
        }
      })
    }
  } catch (err) {
    const error = err as ResultError
    return {
      choices: [],
      error: {
        message: error.data.error ?? 'Unknown error: dynamicTemplateData',
        code: '404'
      }
    }
  }
}

export async function dynamicGroupId(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    id: string
    name: string
    description: string
  }

  interface ResponseType {
    data: ResultItem[]
  }

  try {
    const response: ResponseType = await request(GET_GROUP_IDS_URL, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: response.data.map((group: ResultItem) => {
        return {
          label: `${group.name} [${group.id}]`,
          value: `${group.name} [${group.id}]`
        }
      })
    }
  } catch (err) {
    const error = err as ResultError
    const code = String(error?.response?.status ?? 500)

    return {
      choices: [],
      error: {
        message:
          error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicGroupId',
        code: code
      }
    }
  }
}

export async function dynamicDomain(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    id: string
    subdomain?: string
    domain: string
    username: string
    valid: boolean
  }

  interface ResponseType {
    data: ResultItem[]
  }

  try {
    const response: ResponseType = await request(GET_VALID_DOMAINS_URL, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: response.data
        .filter((domain: ResultItem) => domain.valid === true)
        .map((domain: ResultItem) => {
          return {
            label: `${domain.domain}`,
            value: `${domain.domain}`
          }
        })
    }
  } catch (err) {
    const error = err as ResultError
    const code = String(error?.response?.status ?? 500)

    return {
      choices: [],
      error: {
        message:
          error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicDomain',
        code: code
      }
    }
  }
}

export async function dynamicTemplateId(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    id: string
    name: string
    generation: string
    versions: Version[]
  }

  interface Version {
    id: string
    template_id: string
    active: number
    name: string
    subject: string
  }

  interface ResponseType {
    data: {
      result: ResultItem[]
    }
  }

  try {
    const response: ResponseType = await request(GET_TEMPLATES_URL, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: response.data.result
        .filter((template: ResultItem) => template.generation === 'dynamic')
        .map((template: ResultItem) => {
          return template.versions
            .filter((version: Version) => version.active === 1)
            .map((version: Version) => {
              const truncatedTemplateName =
                template.name.length > TRUNCATE_CHAR_LENGTH
                  ? `${template.name.slice(0, TRUNCATE_CHAR_LENGTH)}...`
                  : template.name
              const truncatedVersionName =
                version.name.length > TRUNCATE_CHAR_LENGTH
                  ? `${version.name.slice(0, TRUNCATE_CHAR_LENGTH)}...`
                  : version.name

              return {
                label: `${truncatedTemplateName} - ${truncatedVersionName} [${version.template_id}]`,
                value: `${truncatedTemplateName} - ${truncatedVersionName} [${version.template_id}]`
              }
            })
        })
        .flat()
    }
  } catch (err) {
    const error = err as ResultError
    const code = String(error?.response?.status ?? 500)

    return {
      choices: [],
      error: {
        message:
          error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicGetTemplates',
        code: code
      }
    }
  }
}

export async function dynamicIpPoolNames(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: ResultItem[]
  }

  interface ResultItem {
    name: string
  }

  try {
    const response: ResponseType = await request(GET_IP_POOLS_URL, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: response.data.map((item) => {
        return {
          label: item.name,
          value: item.name
        }
      })
    }
  } catch (err) {
    const error = err as ResultError
    const code = String(error?.response?.status ?? 500)

    return {
      choices: [],
      error: {
        message:
          error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicIpPoolNames',
        code: code
      }
    }
  }
}
