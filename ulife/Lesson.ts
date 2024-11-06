import type { Page } from 'puppeteer-core';
import { UlifePage } from './Page';

export class UlifeLesson extends UlifePage {
  constructor(
    page: Page,
    protected _pageHref: string,
    private name: string,
  ) {
    super(page);
  }

  private _content: { heading: string; body: string }[] = [];

  public get content(): string {
    return this._content.reduce(
      (acc, { heading, body }) => acc + `## ${heading}\n` + `${body}\n\n`,
      `# ${this.name}\n\n`,
    );
  }

  public async init() {
    await super.init();

    await this.page.locator('iframe.iframeFullCont').wait();
    const htmlFrameHandler = await this.page.$('iframe.iframeFullCont');
    const htmlFrame = await htmlFrameHandler?.contentFrame();

    if (htmlFrame) {
      let previewUrl = htmlFrame.url();

      const previewButton = await htmlFrame.$('.cover > .wrapper > .button > a#openWindow');

      if (previewButton) {
        const previewButtonHref = await previewButton.getProperty('href');

        // Sometimes, the actual lesson is behind a button with relative href,
        // that's what the URL object is for. It returns a jshandle, so the pathname's got the actual URL.
        previewUrl = new URL(previewButtonHref.toString()).pathname;
      }

      await this.page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
    }

    try {
      await this.page.locator('.manage_study_action:last-of-type > div > iframe').setTimeout(5000).wait();
    } catch {
      console.log(
        `It seems that there's no AMP summary on this lesson, you should create a summary for ${this.name} using its .manage_study_action elements.`,
      );
    }

    const ampFrameHandler = await this.page.$('.manage_study_action:last-of-type > div > iframe');
    const ampFrame = await ampFrameHandler?.contentFrame();

    if (ampFrame) {
      const ampContent = await ampFrame.$$eval('amp-story-page', (elements) =>
        elements.map((element) => {
          const heading = element.querySelector('amp-story-grid-layer[template="vertical"]')?.textContent?.trim() || '';
          const body = element.querySelector('amp-story-grid-layer[template="vertical"].bottom')?.textContent?.trim() || '';

          return { heading, body };
        }),
      );

      this._content = ampContent;
    }
  }
}
