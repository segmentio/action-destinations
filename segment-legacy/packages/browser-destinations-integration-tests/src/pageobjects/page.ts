class Page {
  async loadDestination(destination: string): Promise<void> {
    await browser.url(`${browser.options.baseUrl}?destination=${destination}`)

    await browser.waitUntil(() => browser.execute(() => document.readyState === 'complete'), {
      timeout: 10000
    })
  }
}

export default new Page()
