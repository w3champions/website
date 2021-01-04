/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Generates locale files in `src/locales/[lang].ts`
 * Content is pulled from this Goolge Sheet:
 * https://docs.google.com/spreadsheets/d/1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok/edit?pli=1#gid=0
 *
 * Authentication docs: https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
 */
require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const doc = new GoogleSpreadsheet(
  "1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok"
);
console.log({ apikey: process.env.GOOGLE_API_KEY });
doc.useApiKey(process.env.GOOGLE_API_KEY);

async function main() {
  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);
  const firstSheet = doc.sheetsByIndex[0];
  const rows = await firstSheet.getRows({ offset: 10, limit: 2 });
  console.log(rows);
}

main();
