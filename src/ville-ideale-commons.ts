import { Page } from "puppeteer";
import { delay } from "./async-utils";

export const WAIT_DELAY_MS = 5000;

export async function disableCookieAskerIfPresent(page: Page) {
    await page.waitForSelector(".cl-consent__buttons a:nth-child(2)", { timeout: 1000 })
        .then(() => page.click(".cl-consent__buttons a:nth-child(2)"))
        .then(() => delay(1000))
        .catch(() => console.log("No cookie asker present, continue normally"));
}