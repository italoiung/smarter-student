import { launch } from 'puppeteer-core';
import { UlifeDashboard } from './ulife/Dashboard';
import { UlifeSubject } from './ulife/Subject';
import { UlifeLesson } from './ulife/Lesson';

const browser = await launch({
  executablePath: `${process.env.CHROME_EXECUTABLE_PATH}`,
  headless: false,
  defaultViewport: null,
  args: [
    `--user-data-dir=${process.env.CHROME_DATA_DIR}/Profile_2`,
    '--no-zygote',
    '--no-sandbox',
  ],
  ignoreDefaultArgs: ['--enable-automation'],
});

const [main] = await browser.pages();

await main.goto('https://estudantesuniritter.ead.br/', { waitUntil: 'networkidle0' });
try {
  await main.locator('.modal-card.is-active button').setTimeout(5000).click();
} catch {
  console.log('Gladly, there was not an ad.');
}

await main.locator('.card-button.app-card.ulife').click();
await main.waitForNavigation();

const dashboard = new UlifeDashboard(await browser.newPage());
await dashboard.init();
await dashboard.ready;

await main.close();

for (const { name: subjectName, url: subjectUrl } of dashboard.subjects) {
  const subject = new UlifeSubject(await browser.newPage(), subjectUrl);

  await subject.init();
  await subject.ready;

  for (const { name: lessonName, url: lessonUrl } of subject.lessons) {
    const lesson = new UlifeLesson(await browser.newPage(), lessonUrl);

    await lesson.init();

    await Bun.write(`${process.env.OBSIDIAN_VAULT_DIR}/${subjectName}/${lessonName}.md`, lesson.content);

    await lesson.destroy();
  }

  await subject.destroy();
}

process.on('SIGINT', async () => {
  await browser.close();
});
