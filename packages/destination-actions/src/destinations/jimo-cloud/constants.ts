export const JIMO_BASE_URL = 'https://karabor-sewers.usejimo.com'
export const JIMO_USER_PATH = `/segmentio-cloud/user`
export const JIMO_TEST_PATH = `/segmentio-cloud/verifyapikey`

export const buildJimoUrl = (path: string) => `${JIMO_BASE_URL}${path}`
