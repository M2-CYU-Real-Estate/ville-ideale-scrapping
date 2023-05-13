import puppeteer, { Browser, Page, PuppeteerLifeCycleEvent } from "puppeteer";
import { delay } from "./async-utils";

export async function createBrowser(show: boolean = true): Promise<[Browser, Page]> {
    const browser = await puppeteer.launch({
        headless: !show,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox', // useful when using docker (allow using app as admin)
        ]
    });
    
    // const page = await (await browser.pages()).at(0);
    const page = await browser.newPage();
    if (!page) {
        throw new Error("page is not opened properly");
    }

    // Set a timeout for all subsequent actions performed on the page
    page.setDefaultTimeout(60000); // 60 seconds
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
    console.log(`Go to url ${url}`);
    await page.goto(url, {waitUntil: waitUntil});
    await delay(delayMsAfterLoad)
}