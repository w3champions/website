import merge from "lodash/merge";
import localizationData from "./data";
import en from "./en";

const languages = merge(localizationData, { en });

export default languages;
