import type { Handler, HTTPRequest, HTTPResponse, Page } from 'puppeteer-core';

export interface IApiRespose {
  Result: Object | Array<Object>;
}

export abstract class UlifePage {
  static ULIFE_HOSTNAME = 'ulife.com.br' as const;
  protected _pageHref: string | undefined;

  private get pageHref() {
    return this._pageHref;
  }

  protected setStatusReady = (_?: unknown) => {};
  protected setStatusFailed = (_?: unknown) => {};
  public ready = new Promise((resolve, reject) => {
    this.setStatusReady = resolve;
    this.setStatusFailed = reject;
  });

  constructor(protected page: Page) {}

  protected onRequest: Handler<HTTPRequest> = (request) => {
    const requestUrl = new URL(request.url());

    if (requestUrl.hostname.includes(UlifePage.ULIFE_HOSTNAME)) {
      request.continue({ url: requestUrl.href });
    } else {
      request.abort();
    }
  };

  protected onResponse: Handler<HTTPResponse> = async () => {};

  private loadAll = async () => {
    while (true) {
      try {
        await this.page.locator('p:not(.ng-hide) > a.showMoreButton.showMoreBot').setTimeout(4000).click();
      } catch {
        break;
      }
    }
  };

  public async init() {
    const client = await this.page.createCDPSession();

    await client.send('Network.enable');
    await client.send('Network.setBypassServiceWorker', { bypass: true });

    await this.page.setRequestInterception(true);

    this.page.on('request', this.onRequest);
    this.page.on('response', this.onResponse);

    if (this.pageHref) await this.page.goto(this.pageHref);

    await this.loadAll();
  }

  public async destroy() {
    this.page.off('*');
    await this.page.close();
  }
}
