import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { Payload } from './generated-types'
import {
  getTemplatesURL,
  TRUNCATE_CHAR_LENGTH,
  getIPPoolsURL,
  getValidDomainsURL,
  getGroupIDsURL,
  getTemplateContentURL
} from './constants'
import { parseTemplateId } from './utils'
import type { Settings } from '../generated-types'

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

interface ErrorResponse {
  choices: never[]
  error: {
    message: string
    code: string
  }
}

function createErrorResponse(message?: string, code?: string): ErrorResponse {
  return {
    choices: [],
    error: { message: message ?? 'Unknown error', code: code ?? '404' }
  }
}

export function extractVariables(content: string | undefined): string[] {
  if (!content) {
    return []
  }

  const removeIfStartsWith = ['if', 'unless', 'and', 'or', 'equals', 'notEquals', 'lessThan', 'greaterThan', 'each']
  const removeIfMatch = ['else', 'if', 'this', 'insert', 'default', 'length', 'formatDate']

  const regex1 = /{{(.*?)}}/g // matches handlebar expressions. e.g. {{root.user.username | default: "Unknown"}}
  const regex2 = /(["']).*?\1/g // removes anything between quotes. e.g. {{root.user.username | default: }}
  const regex3 = /[#/]?[\w.]+/g // matches words only. e.g. root.user.username , default

  const words =
    [...new Set([...content.matchAll(regex1)].map((match) => match[1]))]
      .map((word) => word.replace(regex2, '').trim())
      .join(' ')
      .match(regex3) ?? []

  const variables = [
    ...new Set(
      words
        .filter((w) => !removeIfMatch.some((item) => w.startsWith(item))) // remove words that start with any of the items in removeIfMatch
        .filter((w) => !removeIfStartsWith.some((item) => w.startsWith(`#${item}`) || w.startsWith(`/${item}`))) // remove words that start with any of the items in removeIfStartsWith
        .map((item) => (item.startsWith('root.') ? item.slice(5).trim() : item)) // remove root. from the start of the word
        .map((item) => item.split('.')[0]) // remove everything after the first dot. for example: user.username -> user
        .filter((item) => !item.includes('"')) // remove if word contains " (double quotes) as this implies it is a constant / string and not a variable
        .filter((item) => isNaN(Number(item))) // remove numeric values
    )
  ]

  return variables
}

export async function dynamicTemplateData(
  request: RequestClient,
  payload: Payload,
  settings: Settings
): Promise<DynamicFieldResponse> {
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
    return createErrorResponse('Template ID Field required before Dynamic Template Data fields can be configured')
  }

  const templateId = parseTemplateId(payload.template_id ?? '')

  if (templateId == null || !templateId.startsWith('d-')) {
    return createErrorResponse('Template must refer to a Dynamic Template. Dynamic Template IDs start with "d-"')
  }

  try {
    const response: ResponseType = await request(getTemplateContentURL(settings, templateId), {
      method: 'GET',
      skipResponseCloning: true
    })

    if (response.data.generation !== 'dynamic') {
      return createErrorResponse('Template ID provided is not a dynamic template')
    }

    const version = response.data.versions.find((version: ResultItem) => version.active === 1)

    if (!version) {
      return createErrorResponse('No active version found for the provided template')
    }

    if (!version.html_content || version.html_content.length === 0) {
      return createErrorResponse('Returned template has no content')
    }

    const uniqueTokens: string[] = [
      ...new Set([
        ...extractVariables(version.html_content),
        ...extractVariables(version.plain_content),
        ...extractVariables(version.subject),
        ...extractVariables(version.thumbnail_url)
      ])
    ]

    // remove token keys that are already selected
    const selectedTokens: string[] = Object.keys(payload.dynamic_template_data ?? {})

    const filteredTokens: string[] = uniqueTokens.filter((token) => !selectedTokens.includes(token))

    if (filteredTokens.length === 0) {
      return createErrorResponse('No dynamic fields found in the provided template')
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
    return createErrorResponse(error?.data?.error ?? 'Unknown error: dynamicTemplateData')
  }
}

export async function dynamicGroupId(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  interface ResultItem {
    id: string
    name: string
    description: string
  }

  interface ResponseType {
    data: ResultItem[]
  }

  try {
    const response: ResponseType = await request(getGroupIDsURL(settings), {
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
    return createErrorResponse(
      error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicGroupId',
      code
    )
  }
}

export async function dynamicDomain(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
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
    const response: ResponseType = await request(getValidDomainsURL(settings), {
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
    return createErrorResponse(
      error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicDomain',
      code
    )
  }
}

export async function dynamicTemplateId(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
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
    const response: ResponseType = await request(getTemplatesURL(settings), {
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
    return createErrorResponse(
      error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicGetTemplates',
      code
    )
  }
}

export async function dynamicIpPoolNames(request: RequestClient, settings: Settings): Promise<DynamicFieldResponse> {
  interface ResponseType {
    data: ResultItem[]
  }

  interface ResultItem {
    name: string
  }

  try {
    const response: ResponseType = await request(getIPPoolsURL(settings), {
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
    return createErrorResponse(
      error?.response?.data?.errors.map((error) => error.message).join(';') ?? 'Unknown error: dynamicIpPoolNames',
      code
    )
  }
}
