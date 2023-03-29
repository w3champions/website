import { Gateways } from "@/store/ranking/types";

export type RootState = {
  darkMode: boolean;
  gateway: Gateways;
  locale: string;
};
