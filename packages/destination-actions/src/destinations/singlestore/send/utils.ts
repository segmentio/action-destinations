import {RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { ExecJSONRequest, ExecJSONResponse } from '../types'

export async function send(request: RequestClient, payloads: Payload[], settings: Settings): Promise<ExecJSONResponse> {
    const { host, port, username, password, dbName, tableName } = settings
    const url = `https://${host}:${port}/api/v2/exec`
    const encodedCredentials = btoa(`${username}:${password}`)

    const sqlValuesClause = Array(payloads.length).fill('(?)').join(', ');
    const sql = `INSERT INTO ${tableName} VALUES ${sqlValuesClause}`

    const requestData: ExecJSONRequest = {
        sql,
        database: dbName,
        args: payloads.map(item => item.message)
    }

    const response = await request<ExecJSONResponse>(url, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${encodedCredentials}`
        },
        json: requestData,
        throwHttpErrors: false
    })

    const responeData: ExecJSONResponse = response.data
    if (typeof responeData.ok === 'boolean' && responeData.ok === false) {
        throw new IntegrationError(`Failed to insert data: ${responeData.error || 'Unknown error'}`, 'Bad Request', 400)
    }
    return responeData
}