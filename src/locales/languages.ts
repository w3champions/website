import deepmerge from "deepmerge";
import localizationData from "./data";
import en from "./en";

const languages = deepmerge(localizationData, { en });
export default languages;
