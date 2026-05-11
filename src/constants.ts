import { Gateways } from "@/store/ranking/types";

export const GATEWAY_REQUIRED_UNTIL_SEASON = 5;

export const isGatewayNeededForSeason = (seasonId: number): boolean => {
  return seasonId <= GATEWAY_REQUIRED_UNTIL_SEASON;
};

export const getDefaultGatewayForSeason = (seasonId: number, currentGateway: Gateways): Gateways => {
  if (!isGatewayNeededForSeason(seasonId)) {
    return Gateways.Europe;
  }

  return currentGateway;
};

const constants = {
  ongoingMatchesRefreshInterval: 30000,
  queueDataRefreshInterval: 10000,
};
export default constants;
