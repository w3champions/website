/**
 * Generates locale files in `src/locales/[lang].ts`
 * Content is pulled from this Goolge Sheet:
 * https://docs.google.com/spreadsheets/d/1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok/edit?pli=1#gid=0
 */

import { GoogleSpreadsheet } from "google-spreadsheet";

const doc = new GoogleSpreadsheet(
  "1WCFB8n_DufVuPIS86Le33gKos6QIR99S0kLI_c-QMok"
);
