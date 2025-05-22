import { ModifiedResponse, RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { Contact, Program, ProgramStatus, ProgramEnrolment, ProgramEnrolementJSON } from '../types'

/**
 * Class representing the Dotdigital Enrolment API.
 * Extends the base Dotdigital API class.
 */
class DDEnrolmentApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client)
  }

  /**
   * Fetches active programs from the Dotdigital API.
   * @returns {Promise<DynamicFieldResponse>} A promise resolving to the list of active programs.
   */
  public async getPrograms(): Promise<DynamicFieldResponse> {
    try {
      const response: ModifiedResponse<Program[]> = await this.get<Program[]>('/v2/programs')
      const programs = response.data
      const choices = programs
        .filter((program: Program) => program.status === ProgramStatus.Active)
        .map((program: Program) => ({
          value: program.id.toString(),
          label: program.name
        }))
      return { choices }
    } catch (error) {
      return {
        choices: [],
        nextPage: '',
        error: {
          message: 'Failed to fetch Programs',
          code: 'PROGRAM_FETCH_ERROR'
        }
      }
    }
  }

  /**
   * Enrols a contact into a program.
   * @param {string} programId - The ID of the program.
   * @param {Contact} contact - The contact to enrol.
   * @returns {Promise<ProgramEnrolment>} A promise resolving to the program enrolment details.
   */
  public async enrolContact(programId: string, contact: Contact): Promise<ProgramEnrolment> {
    const json: ProgramEnrolementJSON = {
      contacts: [contact.contactId],
      programId
    }
    const response: ModifiedResponse<ProgramEnrolment> = await this.post<ProgramEnrolment, ProgramEnrolementJSON>(
      '/v2/programs/enrolments',
      json
    )
    return response.data
  }
}

export default DDEnrolmentApi
