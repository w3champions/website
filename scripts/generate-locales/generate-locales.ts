/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Generates locale files in `src/locales/[lang].ts`
 * Content is pulled from this Goolge Sheet:
 * https://docs.google.com/spreadsheets/d/1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok/edit?pli=1#gid=0
 *
 * Authentication docs: https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
 */
const creds = require("./credentials.json");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const doc = new GoogleSpreadsheet(
  "1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok"
);

async function main() {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);
}

main();
