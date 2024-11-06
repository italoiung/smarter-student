import type { Browser, Page } from 'puppeteer-core';

export const getNewTarget = async (browser: Browser) =>
  new Promise<Page | null>((resolve) => browser.once('targetcreated', (target) => resolve(target.page())));
