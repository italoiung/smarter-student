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
      .workbench .manage_study_action:not(.manage_study_bloco) > .ABA .aba-content titulo,
      .workbench .manage_study_action:not(.manage_study_bloco) > .ABA .aba-content subtitulo,
      .workbench .manage_study_action:not(.manage_study_bloco) > .ABA .aba-content > *:not(.acessibility-hidden),
      .workbench .manage_study_action:not(.manage_study_bloco) > *:not(
        .manage_study_list, .manage_study_comments_container, .ABA, .slider-reborn, .video-reborn, .podcast-reborn,
        .slider, .linhadotempo, .audiotranscricao, .author-anima, .bg-game, .checker, .fillin, .flipCard, .flipper, .judge, .ordenar, .quiz, .trilha
      )`,
      (elements) =>
        elements.map((element) => {
          if (element.tagName === 'TABLE') return element.outerHTML;

          const textContent = element.textContent?.trim().replace(/(\s*\n\s*)|(\s*\t+\s*)/gm, '\n').replace(/(\n+\n\n*)|(\n*\n\n+)/gm, '\n\n');
          if (!textContent) return '';

          const singleLineContent = textContent.replace(/\n+/gm, ' - ');
          if (element.classList.contains('topic-title')) return `# ${singleLineContent}`;
          if (element.classList.contains('e-title')) return `## ${singleLineContent}`;
          if (
            element.classList.contains('T-QUADRO') ||
            element.classList.contains('T-TABELA') ||
            element.tagName === 'TITULO'
          ) return `### ${singleLineContent}`;
          if (element.tagName === 'SUBTITULO') return `#### ${singleLineContent}`;
          if (element.classList.contains('quote')) return `> ${singleLineContent}`;

          const imageContent = element.querySelector('img');
          const externalLink = element.querySelector('a');
          if (!imageContent)
            return externalLink?.href.startsWith('http') && !textContent?.includes(externalLink.href)
              ? `[${singleLineContent}](${externalLink?.href})`
              : `${textContent}`;

          const imageTitle = (imageContent.alt || imageContent.title).trim().replace(/([\s\n]*\n[\s\n]*)+/gm, ' - ');
          if (element.classList.contains('figura'))
            return `### ${singleLineContent}\n\n![${imageTitle}](${imageContent.src})`;
          return `${textContent}\n\n![${imageTitle}](${imageContent.src})`;
        }),
    );

    this._content = [...this._content, ...htmlElements];
  }
}
