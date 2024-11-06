# smarter-student

## Project description
A Puppeteer instance with an authenticated Chrome user's data to navigate the student's logged-in dashboard. It'll crawl mostly ULife pages and auto-generate Obsidian documents for each subject and its lessons. The subjects' documents are gonna include each subject's criteria and calendar, besides relevant notes. The lessons' documents will contain a brief summary.

For now, all it does is retrieve the content of an AMP summary that's present at the bottom of every lesson.

## Technologies used
- [Bun](https://bun.sh/)
- Puppeteer
- Chrome browser

### Instalation
Remember that you must have installed a Chrome browser before running this project.

Copy the `.env.example` file and rename it to `.env`, then specify you Chrome data directory and the destination for the `.md` generated documents.

```
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome
CHROME_DATA_DIR=/home/YourUser/.config/google-chrome
OBSIDIAN_VAULT_DIR=/home/YourUser/Documents
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Roadmap
- [x] Open school homepage, wait for logged-in dashboard and then navigate to the virtual classroom environment.
- [x] Set up entities to handle each navigation step and intercept its network requests
- [x] Scrape summary at the bottom of every lesson and then write its content in a markdown file
- [ ] Scrape only text and images from each lesson and then add to the markdown file
- [ ] Generate richer summary using AI
