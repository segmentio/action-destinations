

export interface sendEmailReq {
    personalizations: [
        {
            from: {
                email: string,
                name?: string
            },
            to: [
                {
                    email: string,
                    name?: string
                }
            ],
            bcc: [
                {
                    email: string
                    name?: string
                }
            ],
            subject: string,
            headers?: {
                [key: string]: string
            },
            dynamic_template_data?: {
                [key: string]: string
            },
            custom_args?: {
                [key: string]: string
            }, 
            send_at?: number
        }
    ]
}