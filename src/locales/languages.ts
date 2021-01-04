import deepmerge from "deepmerge";
import localizationData from "./data";
import en from "./en";

export const ACTIVE_LANGUAGES = ["en", "de"];

const languages = deepmerge(localizationData, { en });
export default languages;
