import puppeteer, { Browser, Page, PuppeteerLifeCycleEvent } from "puppeteer";
import { delay } from "./async-utils";

export async function createBrowser(show: boolean = true): Promise<[Browser, Page]> {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox'], // useful when using docker (allow using app as admin)
        headless: !show,
        ignoreHTTPSErrors: true,
      });
    
      const page = await (await browser.pages()).at(0);
    if (!page) {
      throw new Error("page is not opened properly");
    }

    // Set a timeout for all subsequent actions performed on the page
    page.setDefaultTimeout(50000); // 30 seconds
    return [browser, page];
}

interface GoToUrlOptions {
    delayMsAfterLoad?: number;
    waitUntil?: PuppeteerLifeCycleEvent;
}

export async function goToUrl(
    page: Page, 
    url: string, 
    { delayMsAfterLoad = 500, waitUntil = 'domcontentloaded' } : GoToUrlOptions) {
    await page.goto(url, {waitUntil: waitUntil});
    await delay(delayMsAfterLoad)
}