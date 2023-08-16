export interface UnlayerResponse {
  success: boolean
  data: {
    html: string
    chunks: {
      css: string
      js: string
      fonts: string[]
      body: string
    }
  }
}
