import type { Page } from 'puppeteer-core';
import { UlifePage } from './Page';

export class UlifeLesson extends UlifePage {
  constructor(
    page: Page,
    protected _pageHref: string,
  ) {
    super(page);
  }

  private _content: string[] = [];

  public get content(): string {
    return this._content.join('\n\n');
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

      await this.page.goto(previewUrl, { waitUntil: 'networkidle0' });
    }

    await this.page.locator('.workbench .manage_study_action').wait();

    const htmlElements = await this.page.$$eval(`.workbench .topic-title, .workbench .e-title, .workbench .T-QUADRO, .workbench .T-TABELA,
      .workbench .manage_study_action:not(.manage_study_bloco) > .slider-reborn .slide-reborn .figura,
      .workbench .manage_study_action:not(.manage_study_bloco) > .slider-reborn .slide-reborn .slide-texto,
      .workbench .manage_study_action:not(.manage_study_bloco) > *:not(.manage_study_list, .manage_study_comments_container, 
        .OBJETIVOS, .slider-reborn, .video-reborn, .podcast-reborn, .checker, .fillin, .flipCard, .flipper, .judge, .ordenar, .quiz, .trilha)`,
      (elements) =>
        elements.map((element) => {
          const textContent = element.textContent?.trim().replace(/(\n\s+)|(\n*\t+\n*\s*)/gm, '\n');
          if (element.classList.contains('topic-title')) return `# ${textContent}`;
          if (element.classList.contains('e-title')) return `## ${textContent}`;
          if (element.classList.contains('T-QUADRO') || element.classList.contains('T-TABELA')) return `### ${textContent}`;
          if (element.classList.contains('quote')) return `> ${textContent}`;
          if (element.classList.contains('apostila-reborn') || element.classList.contains('saibamais-reborn')) return `[${textContent}](${element.querySelector('a')?.href})`;
          const imageContent = element.querySelector('img');
          if (!imageContent) return `${textContent}`;
          if (element.classList.contains('figura')) return `### ${textContent}\n![${imageContent.alt}](${imageContent.src})`;
          return `${textContent}\n![${imageContent.alt}](${imageContent.src})`
        }),
    );

    this._content = [...this._content, ...htmlElements];

    const ampFrameHandler = await this.page.$('.manage_study_action:last-of-type > div > iframe');
    const ampFrame = await ampFrameHandler?.contentFrame();

    if (ampFrame) {
      const ampContent = await ampFrame.$$eval('amp-story-page', (elements) =>
        elements.map((element) => 
          {
            const heading = element.querySelector('amp-story-grid-layer[template="vertical"]')?.textContent?.trim() || '';
            const body = element.querySelector('amp-story-grid-layer[template="vertical"].bottom')?.textContent?.trim() || '';

            return `### ${heading}\n${body}`;
          }
        ),
      );

      this._content = [...this._content, '## Resumo', ...ampContent];
    }
  }
}
