import { ElementHandle, Page } from "puppeteer";
import { delay } from "./async-utils";
import { goToUrl } from "./puppeteer-utils";
import { disableCookieAskerIfPresent, WAIT_DELAY_MS } from "./ville-ideale-commons";

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

export async function findCityUrls(page: Page) {
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