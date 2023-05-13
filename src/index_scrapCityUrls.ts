import { openSync, writeFileSync } from "fs";
import { resolve } from "path";
import { findCityUrls } from "./find-city-urls";
import { createBrowser } from "./puppeteer-utils";

const OUTPUT_PATH = "out";
const CITY_URLS_FILE_PATH = "city_urls_by_department.json";

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
    saveAsJson(cityUrlsByDepartment, CITY_URLS_FILE_PATH);

    await browser.close();
}

main();