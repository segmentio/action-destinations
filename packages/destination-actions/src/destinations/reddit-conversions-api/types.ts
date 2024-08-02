import { HTTPError } from '@segment/actions-core'

export class RedditConversionsTestAuthenticationError extends HTTPError {
    response: Response & {
        status: number
        data: {
            message: string
        }
    }
}