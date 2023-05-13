import { Page } from "puppeteer";
import { goToUrl } from "./puppeteer-utils";
import { WAIT_DELAY_MS } from "./ville-ideale-commons";

export interface CityScores {
    environment: number,
    transports: number,
    security: number,
    health: number,
    hobbies: number,
    culture: number,
    education: number,
    shops: number,
    qualityOfLife: number,
}

export interface CityInformation {
    url: string;
    title: string;
    name: string;
    postalCode: string;
    department: string;
    areScoresPresent: boolean;
    scores: CityScores;
    normalizedScores: CityScores;
    ratedCityUrlsNearby: string[];
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function findCityScores(
    department: string,
    cityUrls: string[],
    page: Page,
): Promise<CityInformation[]> {
    const infos: CityInformation[] = [];
    for (const cityUrl of cityUrls) {
        const randomeWaitTime = randomInt(WAIT_DELAY_MS - 2000, WAIT_DELAY_MS + 1000);
        await goToUrl(page, cityUrl, {delayMsAfterLoad: randomeWaitTime});
        const info = await scrapeCurrentCityInfo(page, cityUrl, department);
        infos.push(info);
    }
    return infos;
}

async function scrapeCurrentCityInfo(page: Page, url: string, department: string): Promise<CityInformation> {
    const title = await page.$eval("h1", h => h.textContent);
    if (title === null) {
        throw new Error("No title found");
    }
    const m = title.match(/(.*) \((.*)\)/);
    if (m === null || m.length < 3) {
        throw new Error(`Match did not work as expected for title ${title}`);
    }
    const city = m[1];
    const postalCode = m[2];

    const [areScoresPresent, scores, normalizedScores] = await scrapeCurrentCityScore(page);
    const ratedCityUrlsNearby = await scrapeNearestCitiesUrls(page);

    return {
        url: url,
        title: title,
        name: city,
        postalCode: postalCode,
        department: department,
        areScoresPresent: areScoresPresent,
        scores: scores,
        normalizedScores: normalizedScores,
        ratedCityUrlsNearby: ratedCityUrlsNearby
    };
}

async function scrapeCurrentCityScore(page: Page): Promise<[boolean, CityScores, CityScores]> {
    // Check if score is present or not
    const isScoreAbsent = await page.$eval("p#ng", p => p.textContent === ' - / 10');
    if (isScoreAbsent) {
        const scores = {
            environment: -1,
            transports: -1,
            security: -1,
            health: -1,
            hobbies: -1,
            culture: -1,
            education: -1,
            shops: -1,
            qualityOfLife: -1,
        };
        return [!isScoreAbsent, scores, scores];
    }

    // We have the right scores
    const scores = await page.$$eval("table#tablonotes td", 
        tdList => tdList.map(
            td => Number.parseFloat(td.innerHTML.replace(',', '.')
    )));
    if (scores.length !== 9) {
        throw new Error(`Scores array does not have the right size: ${scores.length}`);
    }
    const normalizedScores = scores.map(s => Math.round(s / 10 * 100) / 100);
    return [!isScoreAbsent,
        {
            environment: scores[0],
            transports: scores[1],
            security: scores[2],
            health: scores[3],
            hobbies: scores[4],
            culture: scores[5],
            education: scores[6],
            shops: scores[7],
            qualityOfLife: scores[8], 
        }, 
        {
            environment: normalizedScores[0],
            transports: normalizedScores[1],
            security: normalizedScores[2],
            health: normalizedScores[3],
            hobbies: normalizedScores[4],
            culture: normalizedScores[5],
            education: normalizedScores[6],
            shops: normalizedScores[7],
            qualityOfLife: normalizedScores[8],
        }
    ];
}

async function scrapeNearestCitiesUrls(page: Page) {
    return await page.$$eval("div#vilprox a", 
        aList => aList.map(a => a.href)
    );
}