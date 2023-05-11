import { Browser, ElementHandle, Page } from "puppeteer";
import { createBrowser, goToUrl } from "./puppeteer-utils";
import { delay } from "./async-utils";
import { writeFileSync } from "fs";
import { openSync } from "fs";
import { resolve } from "path";

const WAIT_DELAY_MS = 5000;
const OUTPUT_PATH = "out";

async function disableCookieAskerIfPresent(page: Page) {
    await page.waitForSelector(".cl-consent__buttons a:nth-child(2)", { timeout: 1000 })
        .then(() => page.click(".cl-consent__buttons a:nth-child(2)"))
        .then(() => delay(1000))
        .catch(() => console.log("No cookie asker present, continue normally"));
}

async function findCityUrlsForDepartment(page: Page, departmentLink: ElementHandle<HTMLAnchorElement>): Promise<string[]> {
    await departmentLink.click();
    // Could skip wait here, we don't seem to have request limit for this
    await delay(WAIT_DELAY_MS);

    // Grab all cities's urls
    return await page.$$eval("div#depart a", aListDOM => {
        return aListDOM.map(a => {
            if (a instanceof HTMLAnchorElement) {
                return a.href;
            }
            throw new Error("No anchor here (how it could happen ?)");
        });
    });
}

async function findCityUrls(page: Page) {
    await goToUrl(page, 
        "https://www.ville-ideale.fr/villespardepts.php", 
        {waitUntil: "networkidle0", delayMsAfterLoad: WAIT_DELAY_MS}
    );

    // If a popup is shown, click on the button
    await disableCookieAskerIfPresent(page);

    // Find department's links
    const departmentLinks = await page.$$("p#listedepts > a");

    const cityUrlsByDepartment = new Map<string, string[]>();

    // For each department link, click on it
    // This does NOT open a new page, we just have to take under it
    for (const departmentLink of departmentLinks) {
        const name = await departmentLink.evaluate(l => l.text);
        console.info(`\t Department "${name}"`)
        const cityUrls = await findCityUrlsForDepartment(page, departmentLink);
        cityUrlsByDepartment.set(name, cityUrls);
    }
    return Object.fromEntries(cityUrlsByDepartment);
}

// This saves a file relative to the OUTPUT_PATH folder
function saveAsJson(data: object, filename: string) {
    const file = openSync(resolve(OUTPUT_PATH, filename), "w");
    writeFileSync(file, JSON.stringify(data));
}

async function main() {
    console.info("Open the browser");
    const [browser, page] = await createBrowser(true);

    console.info("==== Find all city urls ====");
    const cityUrlsByDepartment = await findCityUrls(page);
    // Save this
    saveAsJson(cityUrlsByDepartment, 'city_urls_by_department.json');

    await browser.close();
}

main();