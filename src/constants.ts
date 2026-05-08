export const GATEWAY_REQUIRED_UNTIL_SEASON = 5;

export const isGatewayNeededForSeason = (seasonId: number): boolean => {
  return seasonId <= GATEWAY_REQUIRED_UNTIL_SEASON;
};

const constants = {
  ongoingMatchesRefreshInterval: 30000,
  queueDataRefreshInterval: 10000,
};
export default constants;
