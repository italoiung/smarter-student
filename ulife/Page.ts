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

  private _setStatusReady = (_?: unknown) => {};
  private _setStatusFailed = (_?: unknown) => {};
  private _status: 'loaded' | 'error' | 'stale' | 'struggle' = 'stale';

  public get status() {
    return this._status;
  }

  protected set status(res) {
    if (res === 'loaded') this._setStatusReady();
    if (res === 'error') this._setStatusFailed();

    this._status = res;
  }

  private _ready = new Promise((resolve, reject) => {
    this._setStatusReady = resolve;
    this._setStatusFailed = reject;
  });

  public get ready() {
    return this._ready;
  }

  constructor(protected page: Page) {}

  protected onRequest: Handler<HTTPRequest> = (request) => {
    const requestUrl = new URL(request.url());

    if (
      requestUrl.hostname.includes(UlifePage.ULIFE_HOSTNAME) ||
      // Fix error with lessons containing the podcast module that breaks the page if the request is blocked
      requestUrl.hostname.includes('soundcloud.com')
    ) {
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
        if (this.status === 'struggle') this.status = 'stale';
      } catch {
        if (this.status !== 'stale' && this.status !== 'struggle') break;
        console.warn(this.pageHref, 'is struggling with the load more button.')
        if (this.status === 'stale') this.status = 'struggle';
        else if (this.status === 'struggle') this.status = 'error';
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
