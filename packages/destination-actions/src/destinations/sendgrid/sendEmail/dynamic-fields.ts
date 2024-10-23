import { RequestClient } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { GET_TEMPLATES_URL, TRUNCATE_CHAR_LENGTH } from './constants'

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

  try {
    const response: ResponseType = await request(
      GET_TEMPLATES_URL,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )

    return {
        choices: response.data.result
            .filter((template: ResultItem) => template.generation === 'dynamic')
            .map((template: ResultItem) => {
            return template.versions
                .filter((version: Version) => version.active === 1)
                .map((version: Version) => {
                const truncatedTemplateName = template.name.length > TRUNCATE_CHAR_LENGTH ? `${template.name.slice(0, TRUNCATE_CHAR_LENGTH)}...` : template.name
                const truncatedVersionName = version.name.length > TRUNCATE_CHAR_LENGTH ? `${version.name.slice(0, TRUNCATE_CHAR_LENGTH)}...` : version.name
                const truncatedSubject = version.subject.length > TRUNCATE_CHAR_LENGTH ? `${version.subject.slice(0, TRUNCATE_CHAR_LENGTH)}...` : version.subject
            
                return {
                    label: `${truncatedTemplateName} - ${truncatedVersionName} - ${truncatedSubject}`,
                    value: version.template_id
                }
            })
        }).flat()
    }
  } catch (err) {
        const error = err as ResultError
        const code = String(error?.response?.status ?? 500)

        return {
        choices: [],
            error: {
                message: error?.response?.data?.errors.map(error => error.message).join(";") ?? 'Unknown error: dynamicGetTemplates',
                code: code
            }
        }
  }
}