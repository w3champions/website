import deepmerge from "deepmerge";
import localizationData from "./data";
import en from "./en";

export const ACTIVE_LANGUAGES = ["en", "ru", "kr", "zh", "de", "pl", "ua", "pt", "fr"];

const languages = deepmerge(localizationData, { en });
export default languages;
