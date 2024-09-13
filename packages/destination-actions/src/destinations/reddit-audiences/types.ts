export interface AuthSettings {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    accessToken?: string;
}

export interface RequestOptions {
    method?: 'POST' | 'GET' | 'PATCH' | 'post' | 'get' | 'patch';
    headers?: { [key: string]: string };
    body?: string;
    username?: string;
    password?: string;
}

export interface AudienceResponse {
    data: {
        id: string;
        name: string;
        [key: string]: any; // In case there are additional fields
    };
}