import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import {
  GET_TEMPLATES_URL,
  TRUNCATE_CHAR_LENGTH,
  GET_IP_POOLS_URL,
  GET_VALID_DOMAINS_URL,
  GET_GROUP_IDS_URL
} from './constants'

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
          label: `${group.id} - ${group.name}`,
          value: `${group.id} - ${group.name}`
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
            label: `${domain.subdomain}.${domain.domain}`,
            value: `${domain.subdomain}.${domain.domain}`
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
              const truncatedSubject =
                version.subject.length > TRUNCATE_CHAR_LENGTH
                  ? `${version.subject.slice(0, TRUNCATE_CHAR_LENGTH)}...`
                  : version.subject

              return {
                label: `${truncatedTemplateName} - ${truncatedVersionName} - ${truncatedSubject}`,
                value: version.template_id
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
