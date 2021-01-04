/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Generates locale files in `src/locales/[lang].ts`
 * Content is pulled from this Goolge Sheet:
 * https://docs.google.com/spreadsheets/d/1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok/edit?pli=1#gid=0
 *
 * ⚠️ For this script to work you need to have a Google API key with Sheets enabled (https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication)
 * Place it in a .env file as GOOGLE_API_KEY at the root of the project
 */

require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const doc = new GoogleSpreadsheet(
  "1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok"
);
doc.useApiKey(process.env.GOOGLE_API_KEY);

const languages = { en: {}, de: {} }; // , "kr", "zh"

async function main() {
  await doc.loadInfo();
  const firstSheet = doc.sheetsByIndex[0];
  const rows = await firstSheet.getRows({ offset: 1 });

  for (const row of rows) {
    for (const lang in languages) {
      languages[lang][row.location][row.id] = row[lang];
    }
  }

  console.log(languages);

  // [location]: { [id]: [langXrow cell value]}

  // for each row
  //
}

main();
